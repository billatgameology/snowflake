import { STREAM_NOISE_XI, type FarFieldCondition } from "@vcc/core";
import {
  GPU_GG_DIFFUSION_FLAG_DIRICHLET,
  GPU_GG_DIFFUSION_FLAG_DRIFT,
  GPU_GG_DIFFUSION_FLAG_NOISE,
  GPU_GG_DIFFUSION_WGSL,
} from "./diffusion-shaders.ts";
import {
  createGpuGridLayout,
  validateGpuBufferPlan,
  type GpuGridLayout,
} from "./layout.ts";
import { GPU_UNIFORM_BUFFER_USAGE, GpuBufferArena } from "./resources.ts";
import {
  planGpuDispatchRanges,
  type GpuDispatchRange,
  GpuSubmissionController,
} from "./submission.ts";

const GPU_COMPUTE_STAGE = 0x0004;
const UINT32_MAX = 0xffff_ffff;
const claimedArenas = new WeakSet<GpuBufferArena>();

export const GPU_GG_DIFFUSION_UNIFORM_BYTES = 64;
export const GPU_GG_DIFFUSION_MAX_PASSES_PER_SUBMISSION = 64;
export const GPU_TOPOLOGY_FAR_FIELD = 1;
export const GPU_TOPOLOGY_BOUNDARY = 2;
const GPU_TOPOLOGY_KNOWN_MASK =
  GPU_TOPOLOGY_FAR_FIELD | GPU_TOPOLOGY_BOUNDARY;

export const GPU_GG_DIFFUSION_UNIFORM_OFFSETS = {
  dims: 0,
  cellCount: 12,
  plane: 16,
  baseCell: 20,
  generation: 24,
  rngSeed: 28,
  tick: 32,
  streamId: 36,
  flags: 40,
  reserved0: 44,
  phi: 48,
  rho: 52,
  noiseEpsilon: 56,
  reserved1: 60,
} as const;

export interface GpuGgDiffusionInput {
  readonly initialVapor: Float32Array;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  /** Bit 0 marks the fixed-sigma shell; bit 1 marks current G-G boundary membership. */
  readonly topology: Uint32Array;
  readonly phi: number;
  readonly rho: number;
  readonly noiseEpsilon: number;
  readonly rngSeed: number;
  readonly tick: number;
  readonly farField: FarFieldCondition;
}

export interface GpuGgDiffusionSnapshot {
  readonly initialVapor: Float32Array;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly topology: Uint32Array;
  readonly phi: number;
  readonly rho: number;
  readonly noiseEpsilon: number;
  readonly rngSeed: number;
  readonly tick: number;
  readonly farField: FarFieldCondition;
  readonly flags: number;
}

export interface GpuGgDiffusionUniformValues {
  readonly layout: GpuGridLayout;
  readonly baseCell: number;
  readonly generation: number;
  readonly rngSeed: number;
  readonly tick: number;
  readonly flags: number;
  readonly phi: number;
  readonly rho: number;
  readonly noiseEpsilon: number;
}

export interface GpuGgDiffusionControls {
  readonly tick: number;
  readonly rho: number;
  readonly phi: number;
}

const float32LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Float32Array.prototype) as object,
  "length",
)?.get;
const uint32LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint32Array.prototype) as object,
  "length",
)?.get;

function copyFloat32(values: Float32Array, label: string): Float32Array {
  if (float32LengthGetter === undefined) {
    throw new Error("Float32Array length intrinsic is unavailable");
  }
  let length: number;
  try {
    length = Reflect.apply(float32LengthGetter, values, []) as number;
  } catch {
    throw new Error(`${label} must be a genuine Float32Array`);
  }
  const owned = new Float32Array(length);
  for (let index = 0; index < length; index++) owned[index] = values[index];
  return owned;
}

function copyUint32(values: Uint32Array, label: string): Uint32Array {
  if (uint32LengthGetter === undefined) {
    throw new Error("Uint32Array length intrinsic is unavailable");
  }
  let length: number;
  try {
    length = Reflect.apply(uint32LengthGetter, values, []) as number;
  } catch {
    throw new Error(`${label} must be a genuine Uint32Array`);
  }
  const owned = new Uint32Array(length);
  for (let index = 0; index < length; index++) owned[index] = values[index];
  return owned;
}

function requireU32(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new Error(`${label} must be a u32-safe integer`);
  }
  return value;
}

function requireFiniteFloat32(value: number, label: string): number {
  const rounded = Math.fround(value);
  if (!Number.isFinite(value) || !Number.isFinite(rounded)) {
    throw new Error(`${label} must be finite and representable as f32`);
  }
  return value;
}

export function snapshotGpuGgDiffusionInput(
  layout: GpuGridLayout,
  value: GpuGgDiffusionInput,
): GpuGgDiffusionSnapshot {
  if (value === null || typeof value !== "object") {
    throw new Error("GPU G-G diffusion input must be an object");
  }
  const record = value as unknown as Record<string, unknown>;
  const initialVaporValue = record.initialVapor;
  const occupancyValue = record.occupancy;
  const wallValue = record.wall;
  const topologyValue = record.topology;
  if (!(initialVaporValue instanceof Float32Array)) {
    throw new Error("initialVapor must be a Float32Array");
  }
  if (!(occupancyValue instanceof Uint32Array)) {
    throw new Error("occupancy must be a Uint32Array");
  }
  if (!(wallValue instanceof Uint32Array)) {
    throw new Error("wall must be a Uint32Array");
  }
  if (!(topologyValue instanceof Uint32Array)) {
    throw new Error("topology must be a Uint32Array");
  }
  const initialVapor = copyFloat32(initialVaporValue, "initialVapor");
  const occupancy = copyUint32(occupancyValue, "occupancy");
  const wall = copyUint32(wallValue, "wall");
  const topology = copyUint32(topologyValue, "topology");
  const phi = record.phi as number;
  const rho = record.rho as number;
  const noiseEpsilon = record.noiseEpsilon as number;
  const rngSeed = record.rngSeed as number;
  const tick = record.tick as number;
  const farField = record.farField;

  for (const [label, array] of [
    ["initialVapor", initialVapor],
    ["occupancy", occupancy],
    ["wall", wall],
    ["topology", topology],
  ] as const) {
    if (array.length !== layout.cellCount) {
      throw new Error(
        `${label} length ${array.length} does not match cell count ${layout.cellCount}`,
      );
    }
  }
  requireFiniteFloat32(phi, "phi");
  if (phi < 0 || phi >= 1) throw new Error("phi must be in [0,1)");
  requireFiniteFloat32(rho, "rho");
  if (rho <= 0) throw new Error("rho must be positive");
  requireFiniteFloat32(noiseEpsilon, "noiseEpsilon");
  if (noiseEpsilon < 0 || noiseEpsilon > 1) {
    throw new Error("noiseEpsilon must be in [0,1]");
  }
  requireU32(rngSeed, "rngSeed");
  requireU32(tick, "tick");
  if (farField !== "reflecting" && farField !== "dirichlet") {
    throw new Error("farField must be reflecting or dirichlet");
  }

  let shellCount = 0;
  for (let index = 0; index < layout.cellCount; index++) {
    const vapor = initialVapor[index];
    const attached = occupancy[index];
    const inactive = wall[index];
    const topologyBits = topology[index];
    if (!Number.isFinite(vapor)) {
      throw new Error(`initialVapor must be finite at ${index}`);
    }
    if (
      attached > 1 ||
      inactive > 1 ||
      (topologyBits & ~GPU_TOPOLOGY_KNOWN_MASK) !== 0
    ) {
      throw new Error(`GPU diffusion masks must be binary at ${index}`);
    }
    if (attached === 1 && inactive === 1) {
      throw new Error(`occupancy and wall overlap at ${index}`);
    }
    if ((attached === 1 || inactive === 1) && vapor !== 0) {
      throw new Error(`blocked vapor must be zero at ${index}`);
    }
    if ((topologyBits & GPU_TOPOLOGY_FAR_FIELD) !== 0) {
      shellCount++;
      if (attached === 1 || inactive === 1) {
        throw new Error(`far-field shell must be active and unattached at ${index}`);
      }
    }
    if (
      (topologyBits & GPU_TOPOLOGY_BOUNDARY) !== 0 &&
      (attached === 1 || inactive === 1)
    ) {
      throw new Error(`boundary topology must be active and unattached at ${index}`);
    }
  }
  if (farField === "dirichlet" && shellCount === 0) {
    throw new Error("Dirichlet diffusion requires a nonempty far-field shell");
  }

  let flags = 0;
  if (noiseEpsilon > 0) flags |= GPU_GG_DIFFUSION_FLAG_NOISE;
  if (phi > 0) flags |= GPU_GG_DIFFUSION_FLAG_DRIFT;
  if (farField === "dirichlet") flags |= GPU_GG_DIFFUSION_FLAG_DIRICHLET;
  return Object.freeze({
    initialVapor,
    occupancy,
    wall,
    topology,
    phi,
    rho,
    noiseEpsilon,
    rngSeed,
    tick,
    farField,
    flags,
  });
}

export function encodeGpuGgDiffusionUniforms(
  values: GpuGgDiffusionUniformValues,
): ArrayBuffer {
  const { layout } = values;
  if (!Number.isSafeInteger(values.baseCell) || values.baseCell < 0) {
    throw new Error("baseCell must be a nonnegative safe integer");
  }
  if (values.baseCell >= layout.cellCount) {
    throw new Error("baseCell must address a cell in the grid");
  }
  requireU32(values.generation, "generation");
  requireU32(values.rngSeed, "rngSeed");
  requireU32(values.tick, "tick");
  requireU32(values.flags, "flags");
  requireFiniteFloat32(values.phi, "phi");
  requireFiniteFloat32(values.rho, "rho");
  requireFiniteFloat32(values.noiseEpsilon, "noiseEpsilon");

  const bytes = new ArrayBuffer(GPU_GG_DIFFUSION_UNIFORM_BYTES);
  const view = new DataView(bytes);
  view.setUint32(0, layout.dims.nx, true);
  view.setUint32(4, layout.dims.ny, true);
  view.setUint32(8, layout.dims.nz, true);
  view.setUint32(12, layout.cellCount, true);
  view.setUint32(16, layout.plane, true);
  view.setUint32(20, values.baseCell, true);
  view.setUint32(24, values.generation, true);
  view.setUint32(28, values.rngSeed, true);
  view.setUint32(32, values.tick, true);
  view.setUint32(36, STREAM_NOISE_XI, true);
  view.setUint32(40, values.flags, true);
  view.setUint32(44, 0, true);
  view.setFloat32(48, values.phi, true);
  view.setFloat32(52, values.rho, true);
  view.setFloat32(56, values.noiseEpsilon, true);
  view.setFloat32(60, 0, true);
  return bytes;
}

interface GpuGgDiffusionPipelines {
  readonly bindGroupLayout: GPUBindGroupLayout;
  readonly prepareNoise: GPUComputePipeline;
  readonly applyNoise: GPUComputePipeline;
  readonly diffuseInPlane: GPUComputePipeline;
  readonly diffuseVertical: GPUComputePipeline;
  readonly applyDrift: GPUComputePipeline;
  readonly commitDiffusion: GPUComputePipeline;
  readonly clampDirichlet: GPUComputePipeline;
}

async function createPipelines(device: GPUDevice): Promise<GpuGgDiffusionPipelines> {
  const module = device.createShaderModule({
    label: "vcc:gg-diffusion",
    code: GPU_GG_DIFFUSION_WGSL,
  });
  const compilation = await module.getCompilationInfo();
  const errors = compilation.messages.filter((message) => message.type === "error");
  if (errors.length > 0) {
    throw new Error(
      `G-G diffusion WGSL compilation failed: ${errors
        .map((message) => `${message.lineNum}:${message.linePos}:${message.message}`)
        .join("; ")}`,
    );
  }
  const bindGroupLayout = device.createBindGroupLayout({
    label: "vcc:gg-diffusion-bindings",
    entries: [
      { binding: 0, visibility: GPU_COMPUTE_STAGE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPU_COMPUTE_STAGE, buffer: { type: "read-only-storage" } },
      { binding: 2, visibility: GPU_COMPUTE_STAGE, buffer: { type: "read-only-storage" } },
      { binding: 3, visibility: GPU_COMPUTE_STAGE, buffer: { type: "read-only-storage" } },
      { binding: 4, visibility: GPU_COMPUTE_STAGE, buffer: { type: "read-only-storage" } },
      { binding: 5, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 6, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 7, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    label: "vcc:gg-diffusion-pipeline-layout",
    bindGroupLayouts: [bindGroupLayout],
  });
  const make = (entryPoint: string) =>
    device.createComputePipelineAsync({
      label: `vcc:gg-diffusion:${entryPoint}`,
      layout: pipelineLayout,
      compute: { module, entryPoint },
    });
  const [
    prepareNoise,
    applyNoise,
    diffuseInPlane,
    diffuseVertical,
    applyDrift,
    commitDiffusion,
    clampDirichlet,
  ] = await Promise.all([
    make("prepareNoise"),
    make("applyNoise"),
    make("diffuseInPlane"),
    make("diffuseVertical"),
    make("applyDrift"),
    make("commitDiffusion"),
    make("clampDirichlet"),
  ]);
  return {
    bindGroupLayout,
    prepareNoise,
    applyNoise,
    diffuseInPlane,
    diffuseVertical,
    applyDrift,
    commitDiffusion,
    clampDirichlet,
  };
}

interface GpuRangeUniform {
  readonly range: GpuDispatchRange;
  readonly buffer: GPUBuffer;
}

interface StageBuffers {
  readonly source: GPUBuffer;
  readonly auxiliaryA: GPUBuffer;
  readonly auxiliaryB: GPUBuffer;
  readonly destination: GPUBuffer;
}

export class GpuGgDiffusion {
  private destroyed = false;
  private inFlight = false;
  private ownedResourcesReleased = false;
  private poisonedReason: string | null = null;
  private activeVapor: "ggVaporA" | "ggVaporB" = "ggVaporA";
  private completedPassesInternal = 0;
  private readonly device: GPUDevice;
  private readonly submissions: GpuSubmissionController;
  private readonly arena: GpuBufferArena;
  readonly generation: number;
  private flags: number;
  private readonly layout: GpuGridLayout;
  private readonly rngSeed: number;
  private readonly noiseEpsilon: number;
  private readonly farField: FarFieldCondition;
  private readonly pipelines: GpuGgDiffusionPipelines;
  private readonly rangeUniforms: readonly GpuRangeUniform[];

  private constructor(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    generation: number,
    snapshot: GpuGgDiffusionSnapshot,
    layout: GpuGridLayout,
    pipelines: GpuGgDiffusionPipelines,
    rangeUniforms: readonly GpuRangeUniform[],
  ) {
    this.device = device;
    this.submissions = submissions;
    this.arena = arena;
    this.generation = generation;
    this.flags = snapshot.flags;
    this.layout = layout;
    this.rngSeed = snapshot.rngSeed;
    this.noiseEpsilon = snapshot.noiseEpsilon;
    this.farField = snapshot.farField;
    this.pipelines = pipelines;
    this.rangeUniforms = rangeUniforms;
  }

  static async create(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    input: GpuGgDiffusionInput,
  ): Promise<GpuGgDiffusion> {
    if (arena.isDestroyed()) throw new Error("GPU diffusion arena is destroyed");
    arena.assertDevice(device);
    submissions.assertDevice(device);
    validateGpuBufferPlan(arena.plan);
    if (arena.plan.operator !== "gg") {
      throw new Error("G-G diffusion requires a gg buffer arena");
    }
    if (arena.generation !== submissions.currentGeneration()) {
      throw new Error("GPU diffusion generation disagrees with the submission controller");
    }
    if (claimedArenas.has(arena)) {
      throw new Error("GPU diffusion arena is already claimed");
    }
    claimedArenas.add(arena);
    const rangeUniforms: GpuRangeUniform[] = [];
    let arenaUploadStarted = false;
    try {
      const layout = createGpuGridLayout(arena.plan.layout.dims);
      const snapshot = snapshotGpuGgDiffusionInput(layout, input);
      const ranges = planGpuDispatchRanges(layout.cellCount);
      const pipelines = await createPipelines(device);
      validateGpuBufferPlan(arena.plan);
      if (arena.generation !== submissions.currentGeneration()) {
        throw new Error(
          "GPU diffusion generation became stale during pipeline construction",
        );
      }
      for (const range of ranges) {
        const buffer = device.createBuffer({
          label: `vcc:gg-diffusion:${arena.generation}:uniform:${range.baseCell}`,
          size: GPU_GG_DIFFUSION_UNIFORM_BYTES,
          usage: GPU_UNIFORM_BUFFER_USAGE,
        });
        rangeUniforms.push({ range, buffer });
        const bytes = encodeGpuGgDiffusionUniforms({
          layout,
          baseCell: range.baseCell,
          generation: arena.generation,
          rngSeed: snapshot.rngSeed,
          tick: snapshot.tick,
          flags: snapshot.flags,
          phi: snapshot.phi,
          rho: snapshot.rho,
          noiseEpsilon: snapshot.noiseEpsilon,
        });
        device.queue.writeBuffer(buffer, 0, bytes);
      }
      arenaUploadStarted = true;
      arena.upload(device, "occupancy", snapshot.occupancy);
      arena.upload(device, "wall", snapshot.wall);
      arena.upload(device, "topology", snapshot.topology);
      arena.upload(device, "ggVaporA", snapshot.initialVapor);
      arena.upload(device, "ggVaporB", new Float32Array(layout.cellCount));
      return new GpuGgDiffusion(
        device,
        submissions,
        arena,
        arena.generation,
        snapshot,
        layout,
        pipelines,
        rangeUniforms,
      );
    } catch (error) {
      for (const entry of rangeUniforms) entry.buffer.destroy();
      claimedArenas.delete(arena);
      if (arenaUploadStarted) arena.destroy();
      throw error;
    }
  }

  completedPasses(): number {
    return this.completedPassesInternal;
  }

  activeVaporName(): "ggVaporA" | "ggVaporB" {
    this.assertUsable();
    return this.activeVapor;
  }

  activeVaporBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get(this.activeVapor);
  }

  inactiveVaporName(): "ggVaporA" | "ggVaporB" {
    this.assertUsable();
    return this.activeVapor === "ggVaporA" ? "ggVaporB" : "ggVaporA";
  }

  updateControls(controls: GpuGgDiffusionControls): void {
    this.assertUsable();
    if (this.inFlight) {
      throw new Error("cannot update GPU diffusion controls while work is in flight");
    }
    requireU32(controls.tick, "tick");
    requireFiniteFloat32(controls.rho, "rho");
    if (controls.rho <= 0) throw new Error("rho must be positive");
    requireFiniteFloat32(controls.phi, "phi");
    if (controls.phi < 0 || controls.phi >= 1) {
      throw new Error("phi must be in [0,1)");
    }
    let flags = 0;
    if (this.noiseEpsilon > 0) flags |= GPU_GG_DIFFUSION_FLAG_NOISE;
    if (controls.phi > 0) flags |= GPU_GG_DIFFUSION_FLAG_DRIFT;
    if (this.farField === "dirichlet") flags |= GPU_GG_DIFFUSION_FLAG_DIRICHLET;
    const payloads = this.rangeUniforms.map((entry) =>
      encodeGpuGgDiffusionUniforms({
        layout: this.layout,
        baseCell: entry.range.baseCell,
        generation: this.generation,
        rngSeed: this.rngSeed,
        tick: controls.tick,
        flags,
        phi: controls.phi,
        rho: controls.rho,
        noiseEpsilon: this.noiseEpsilon,
      }),
    );
    try {
      for (let index = 0; index < this.rangeUniforms.length; index++) {
        this.device.queue.writeBuffer(
          this.rangeUniforms[index].buffer,
          0,
          payloads[index],
        );
      }
      this.flags = flags;
    } catch (error) {
      this.poison(error);
      throw error;
    }
  }

  async runPasses(passCount: number, label = "gg-diffusion"): Promise<void> {
    this.assertUsable();
    if (
      !Number.isSafeInteger(passCount) ||
      passCount <= 0 ||
      passCount > GPU_GG_DIFFUSION_MAX_PASSES_PER_SUBMISSION
    ) {
      throw new Error(
        `passCount must be in [1,${GPU_GG_DIFFUSION_MAX_PASSES_PER_SUBMISSION}]`,
      );
    }
    if (this.completedPassesInternal + passCount > UINT32_MAX) {
      throw new Error("GPU G-G diffusion total pass count exceeds u32");
    }
    if (this.inFlight) {
      throw new Error("a GPU G-G diffusion submission is already in flight");
    }
    this.inFlight = true;
    try {
      const encoder = this.device.createCommandEncoder({
        label: `vcc:${label}:generation-${this.generation}`,
      });
      let sourceName = this.activeVapor;
      for (let passIndex = 0; passIndex < passCount; passIndex++) {
        const destinationName =
          sourceName === "ggVaporA" ? "ggVaporB" : "ggVaporA";
        this.encodeOnePass(
          encoder,
          sourceName,
          destinationName,
          this.completedPassesInternal + passIndex + 1,
        );
        sourceName = destinationName;
      }
      const commandBuffer = encoder.finish({
        label: `vcc:${label}:generation-${this.generation}:commands`,
      });
      await this.submissions.submit(label, this.generation, [commandBuffer]);
      this.activeVapor = sourceName;
      this.completedPassesInternal += passCount;
    } catch (error) {
      this.poison(error);
      throw error;
    } finally {
      this.inFlight = false;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    if (this.inFlight) {
      throw new Error("cannot destroy GPU G-G diffusion while work is in flight");
    }
    this.destroyed = true;
    this.releaseOwnedResources(false);
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  private encodeOnePass(
    encoder: GPUCommandEncoder,
    sourceName: "ggVaporA" | "ggVaporB",
    destinationName: "ggVaporA" | "ggVaporB",
    passOrdinal: number,
  ): void {
    const source = this.arena.get(sourceName);
    const next = this.arena.get(destinationName);
    const occupancy = this.arena.get("occupancy");
    const wall = this.arena.get("wall");
    const topology = this.arena.get("topology");
    const scratchA = this.arena.get("scratchScalarA");
    const scratchB = this.arena.get("scratchScalarB");
    const noise = this.arena.get("noise");
    const refusal = this.arena.get("reduction");
    const pass = encoder.beginComputePass({
      label: `vcc:gg-diffusion:pass-${passOrdinal}`,
    });

    const dispatchStage = (
      pipeline: GPUComputePipeline,
      buffers: StageBuffers,
    ): void => {
      pass.setPipeline(pipeline);
      for (const entry of this.rangeUniforms) {
        const bindGroup = this.device.createBindGroup({
          label: `vcc:gg-diffusion:bind:${entry.range.baseCell}`,
          layout: this.pipelines.bindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: entry.buffer } },
            { binding: 1, resource: { buffer: occupancy } },
            { binding: 2, resource: { buffer: wall } },
            { binding: 3, resource: { buffer: topology } },
            { binding: 4, resource: { buffer: buffers.source } },
            { binding: 5, resource: { buffer: buffers.auxiliaryA } },
            { binding: 6, resource: { buffer: buffers.auxiliaryB } },
            { binding: 7, resource: { buffer: buffers.destination } },
          ],
        });
        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(entry.range.workgroupCount);
      }
    };

    if ((this.flags & GPU_GG_DIFFUSION_FLAG_NOISE) !== 0) {
      dispatchStage(this.pipelines.prepareNoise, {
        source,
        auxiliaryA: noise,
        auxiliaryB: refusal,
        destination: next,
      });
      dispatchStage(this.pipelines.applyNoise, {
        source,
        auxiliaryA: scratchB,
        auxiliaryB: noise,
        destination: next,
      });
    }
    dispatchStage(this.pipelines.diffuseInPlane, {
      source:
        (this.flags & GPU_GG_DIFFUSION_FLAG_NOISE) !== 0
          ? scratchB
          : source,
      auxiliaryA: scratchA,
      auxiliaryB:
        (this.flags & GPU_GG_DIFFUSION_FLAG_NOISE) !== 0 ? refusal : noise,
      destination: next,
    });
    dispatchStage(this.pipelines.diffuseVertical, {
      source: scratchA,
      auxiliaryA: scratchB,
      auxiliaryB: noise,
      destination: next,
    });
    if ((this.flags & GPU_GG_DIFFUSION_FLAG_DRIFT) !== 0) {
      dispatchStage(this.pipelines.applyDrift, {
        source: scratchB,
        auxiliaryA: scratchA,
        auxiliaryB: noise,
        destination: next,
      });
    }
    dispatchStage(this.pipelines.commitDiffusion, {
      source:
        (this.flags & GPU_GG_DIFFUSION_FLAG_DRIFT) !== 0
          ? scratchA
          : scratchB,
      auxiliaryA: source,
      auxiliaryB: noise,
      destination: next,
    });
    if ((this.flags & GPU_GG_DIFFUSION_FLAG_DIRICHLET) !== 0) {
      dispatchStage(this.pipelines.clampDirichlet, {
        source,
        auxiliaryA: scratchA,
        auxiliaryB: noise,
        destination: next,
      });
    }
    pass.end();
  }

  private assertUsable(): void {
    if (this.poisonedReason !== null) {
      throw new Error(`GPU G-G diffusion is poisoned: ${this.poisonedReason}`);
    }
    if (this.destroyed) throw new Error("GPU G-G diffusion is destroyed");
    if (this.arena.isDestroyed()) throw new Error("GPU diffusion arena is destroyed");
    if (this.submissions.currentGeneration() !== this.generation) {
      throw new Error("GPU diffusion generation is stale");
    }
  }

  private poison(error: unknown): void {
    if (this.poisonedReason === null) {
      this.poisonedReason =
        error instanceof Error ? error.message : "unknown GPU execution failure";
    }
    this.destroyed = true;
    this.releaseOwnedResources(true);
  }

  private releaseOwnedResources(destroyArena: boolean): void {
    if (!this.ownedResourcesReleased) {
      this.ownedResourcesReleased = true;
      for (const entry of this.rangeUniforms) entry.buffer.destroy();
      claimedArenas.delete(this.arena);
    }
    if (destroyArena) this.arena.destroy();
  }
}
