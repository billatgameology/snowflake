import {
  validateParams,
  type FarFieldCondition,
  type GGParams,
} from "@vcc/core";
import {
  GPU_GG_SURFACE_FLAG_DIRICHLET,
  GPU_GG_SURFACE_WGSL,
} from "./gg-surface-shaders.ts";
import {
  createGpuGridLayout,
  validateGpuBufferPlan,
  type GpuGridLayout,
} from "./layout.ts";
import {
  GPU_CELL_BUFFER_USAGE,
  GPU_UNIFORM_BUFFER_USAGE,
  GpuBufferArena,
} from "./resources.ts";
import {
  planGpuDispatchRanges,
  type GpuDispatchRange,
  GpuSubmissionController,
} from "./submission.ts";

const GPU_COMPUTE_STAGE = 0x0004;
const UINT32_MAX = 0xffff_ffff;
const claimedSurfaceArenas = new WeakSet<GpuBufferArena>();

export const GPU_GG_SURFACE_UNIFORM_BYTES = 144;
export const GPU_GG_CYCLE_REPORT_BYTES = 32;

export const GPU_GG_SURFACE_UNIFORM_OFFSETS = {
  dims: 0,
  cellCount: 12,
  plane: 16,
  baseCell: 20,
  generation: 24,
  tick: 28,
  inputBase: 32,
  inputCount: 36,
  outputBase: 40,
  flags: 44,
  kappa: 48,
  mu: 80,
  ggThreshBeta: 112,
} as const;

export const GPU_GG_CYCLE_REPORT_OFFSETS = {
  boundaryCount: 0,
  attachedTotal: 4,
  attachedNow: 8,
  holeFillNow: 12,
  lastClampDelta: 16,
  dirichletMeter: 20,
  oldBoundaryCount: 24,
  errorFlags: 28,
} as const;

export interface GpuGgSurfaceInput {
  readonly initialBoundaryMass: Float32Array;
  readonly initialBoundaryIndices: Uint32Array;
  readonly attachedCount: number;
  readonly params: GGParams;
  readonly tick: number;
  readonly farField: FarFieldCondition;
}

export interface GpuGgSurfaceControls {
  readonly params: GGParams;
  readonly tick: number;
}

export interface GpuGgSurfaceUniformValues {
  readonly layout: GpuGridLayout;
  readonly baseCell: number;
  readonly generation: number;
  readonly tick: number;
  readonly inputBase: number;
  readonly inputCount: number;
  readonly outputBase: number;
  readonly flags: number;
  readonly params: GGParams;
}

export interface GpuGgReductionDispatch {
  readonly source: "scratchScalarA" | "reduction";
  readonly destination: "scratchScalarA" | "reduction";
  readonly inputBase: number;
  readonly inputCount: number;
  readonly outputBase: number;
  readonly workgroupCount: number;
}

export interface GpuGgReductionPlan {
  readonly dispatches: readonly GpuGgReductionDispatch[];
  readonly finalSource: "scratchScalarA" | "reduction";
}

export interface GpuGgCycleReport {
  readonly boundaryCount: number;
  readonly attachedTotal: number;
  readonly attachedNow: number;
  readonly holeFillNow: number;
  readonly lastClampDelta: number;
  readonly dirichletMeter: number;
  readonly oldBoundaryCount: number;
  readonly errorFlags: number;
}

interface GpuSurfacePipelines {
  readonly bindGroupLayout: GPUBindGroupLayout;
  readonly clearCycleReport: GPUComputePipeline;
  readonly reduceClamp: GPUComputePipeline;
  readonly accumulateClamp: GPUComputePipeline;
  readonly freezeBoundary: GPUComputePipeline;
  readonly decideAttachment: GPUComputePipeline;
  readonly meltBoundary: GPUComputePipeline;
  readonly applyAttachment: GPUComputePipeline;
  readonly rebuildBoundary: GPUComputePipeline;
  readonly publishBoundary: GPUComputePipeline;
}

interface GpuSurfaceUniform {
  readonly range: GpuDispatchRange;
  readonly buffer: GPUBuffer;
}

interface GpuReductionUniform {
  readonly dispatch: GpuGgReductionDispatch;
  readonly buffer: GPUBuffer;
}

const float32LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Float32Array.prototype) as object,
  "length",
)?.get;
const uint32LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint32Array.prototype) as object,
  "length",
)?.get;
const float64LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Float64Array.prototype) as object,
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
  const copy = new Float32Array(length);
  for (let index = 0; index < length; index++) copy[index] = values[index];
  return copy;
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
  const copy = new Uint32Array(length);
  for (let index = 0; index < length; index++) copy[index] = values[index];
  return copy;
}

function copyFloat64(values: Float64Array, label: string): Float64Array {
  if (float64LengthGetter === undefined) {
    throw new Error("Float64Array length intrinsic is unavailable");
  }
  let length: number;
  try {
    length = Reflect.apply(float64LengthGetter, values, []) as number;
  } catch {
    throw new Error(`${label} must be a genuine Float64Array`);
  }
  const copy = new Float64Array(length);
  for (let index = 0; index < length; index++) copy[index] = values[index];
  return copy;
}

function snapshotParams(value: GGParams): GGParams {
  if (value === null || typeof value !== "object") {
    throw new Error("GPU G-G parameters must be an object");
  }
  const record = value as unknown as Record<string, unknown>;
  const rho = record.rho as number;
  const phi = record.phi as number;
  const kappa = record.kappa;
  const mu = record.mu;
  const ggThreshBeta = record.ggThreshBeta;
  if (!(kappa instanceof Float64Array)) {
    throw new Error("params.kappa must be a Float64Array");
  }
  if (!(mu instanceof Float64Array)) {
    throw new Error("params.mu must be a Float64Array");
  }
  if (!(ggThreshBeta instanceof Float64Array)) {
    throw new Error("params.ggThreshBeta must be a Float64Array");
  }
  const owned = {
    rho,
    phi,
    kappa: copyFloat64(kappa, "params.kappa"),
    mu: copyFloat64(mu, "params.mu"),
    ggThreshBeta: copyFloat64(ggThreshBeta, "params.ggThreshBeta"),
  };
  const validation = validateParams(owned);
  if (validation.errors.length > 0) {
    throw new Error(`invalid GPU G-G parameters: ${validation.errors.join("; ")}`);
  }
  for (const [label, vector] of [
    ["kappa", owned.kappa],
    ["mu", owned.mu],
    ["ggThreshBeta", owned.ggThreshBeta],
  ] as const) {
    for (let slot = 1; slot < 8; slot++) {
      if (!Number.isFinite(Math.fround(vector[slot]))) {
        throw new Error(`params.${label}[${slot}] is not representable as f32`);
      }
    }
  }
  if (!Number.isFinite(Math.fround(rho)) || !Number.isFinite(Math.fround(phi))) {
    throw new Error("GPU G-G scalar controls must be representable as f32");
  }
  return owned;
}

function requireU32(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new Error(`${label} must be a u32-safe integer`);
  }
  return value;
}

function writeControlVector(
  view: DataView,
  offset: number,
  values: Float64Array,
): void {
  for (let slot = 0; slot < 8; slot++) {
    view.setFloat32(
      offset + slot * 4,
      slot === 0 ? 0 : values[slot],
      true,
    );
  }
}

export function encodeGpuGgSurfaceUniforms(
  values: GpuGgSurfaceUniformValues,
): ArrayBuffer {
  const { layout } = values;
  requireU32(values.baseCell, "baseCell");
  if (values.baseCell >= layout.cellCount) {
    throw new Error("baseCell must address a cell in the grid");
  }
  requireU32(values.generation, "generation");
  requireU32(values.tick, "tick");
  requireU32(values.inputBase, "inputBase");
  requireU32(values.inputCount, "inputCount");
  requireU32(values.outputBase, "outputBase");
  requireU32(values.flags, "flags");
  const params = snapshotParams(values.params);
  const bytes = new ArrayBuffer(GPU_GG_SURFACE_UNIFORM_BYTES);
  const view = new DataView(bytes);
  view.setUint32(0, layout.dims.nx, true);
  view.setUint32(4, layout.dims.ny, true);
  view.setUint32(8, layout.dims.nz, true);
  view.setUint32(12, layout.cellCount, true);
  view.setUint32(16, layout.plane, true);
  view.setUint32(20, values.baseCell, true);
  view.setUint32(24, values.generation, true);
  view.setUint32(28, values.tick, true);
  view.setUint32(32, values.inputBase, true);
  view.setUint32(36, values.inputCount, true);
  view.setUint32(40, values.outputBase, true);
  view.setUint32(44, values.flags, true);
  writeControlVector(view, 48, params.kappa);
  writeControlVector(view, 80, params.mu);
  writeControlVector(view, 112, params.ggThreshBeta);
  return bytes;
}

export function planGpuGgClampReduction(
  cellCount: number,
): GpuGgReductionPlan {
  requireU32(cellCount, "cellCount");
  if (cellCount === 0) throw new Error("cellCount must be positive");
  const dispatches: GpuGgReductionDispatch[] = [];
  let currentCount = cellCount;
  let source: "scratchScalarA" | "reduction" = "scratchScalarA";
  while (currentCount > 1) {
    const destination: "scratchScalarA" | "reduction" =
      source === "scratchScalarA" ? "reduction" : "scratchScalarA";
    const ranges = planGpuDispatchRanges(currentCount);
    let outputBase = 0;
    for (const range of ranges) {
      dispatches.push({
        source,
        destination,
        inputBase: range.baseCell,
        inputCount: range.cellCount,
        outputBase,
        workgroupCount: range.workgroupCount,
      });
      outputBase += range.workgroupCount;
    }
    currentCount = outputBase;
    source = destination;
  }
  return { dispatches, finalSource: source };
}

export function decodeGpuGgCycleReport(bytes: ArrayBuffer): GpuGgCycleReport {
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== GPU_GG_CYCLE_REPORT_BYTES) {
    throw new Error(
      `GPU G-G cycle report must contain exactly ${GPU_GG_CYCLE_REPORT_BYTES} bytes`,
    );
  }
  const view = new DataView(bytes);
  const report = {
    boundaryCount: view.getUint32(0, true),
    attachedTotal: view.getUint32(4, true),
    attachedNow: view.getUint32(8, true),
    holeFillNow: view.getUint32(12, true),
    lastClampDelta: view.getFloat32(16, true),
    dirichletMeter: view.getFloat32(20, true),
    oldBoundaryCount: view.getUint32(24, true),
    errorFlags: view.getUint32(28, true),
  };
  if (!Number.isFinite(report.lastClampDelta) || !Number.isFinite(report.dirichletMeter)) {
    throw new Error("GPU G-G cycle report contains a non-finite meter");
  }
  return report;
}

async function createPipelines(device: GPUDevice): Promise<GpuSurfacePipelines> {
  const module = device.createShaderModule({
    label: "vcc:gg-surface",
    code: GPU_GG_SURFACE_WGSL,
  });
  const compilation = await module.getCompilationInfo();
  const errors = compilation.messages.filter((message) => message.type === "error");
  if (errors.length > 0) {
    throw new Error(
      `G-G surface WGSL compilation failed: ${errors
        .map((message) => `${message.lineNum}:${message.linePos}:${message.message}`)
        .join("; ")}`,
    );
  }
  const bindGroupLayout = device.createBindGroupLayout({
    label: "vcc:gg-surface-bindings",
    entries: [
      { binding: 0, visibility: GPU_COMPUTE_STAGE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 2, visibility: GPU_COMPUTE_STAGE, buffer: { type: "read-only-storage" } },
      { binding: 3, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 4, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 5, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 6, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 7, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
      { binding: 8, visibility: GPU_COMPUTE_STAGE, buffer: { type: "storage" } },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    label: "vcc:gg-surface-pipeline-layout",
    bindGroupLayouts: [bindGroupLayout],
  });
  const make = (entryPoint: string) =>
    device.createComputePipelineAsync({
      label: `vcc:gg-surface:${entryPoint}`,
      layout: pipelineLayout,
      compute: { module, entryPoint },
    });
  const [
    clearCycleReport,
    reduceClamp,
    accumulateClamp,
    freezeBoundary,
    decideAttachment,
    meltBoundary,
    applyAttachment,
    rebuildBoundary,
    publishBoundary,
  ] = await Promise.all([
    make("clearCycleReport"),
    make("reduceClamp"),
    make("accumulateClamp"),
    make("freezeBoundary"),
    make("decideAttachment"),
    make("meltBoundary"),
    make("applyAttachment"),
    make("rebuildBoundary"),
    make("publishBoundary"),
  ]);
  return {
    bindGroupLayout,
    clearCycleReport,
    reduceClamp,
    accumulateClamp,
    freezeBoundary,
    decideAttachment,
    meltBoundary,
    applyAttachment,
    rebuildBoundary,
    publishBoundary,
  };
}

export class GpuGgSurface {
  private destroyed = false;
  private inFlight = false;
  private poisonedReason: string | null = null;
  private ownedResourcesReleased = false;
  private paramsInternal: GGParams;
  private tickInternal: number;
  private readonly device: GPUDevice;
  private readonly submissions: GpuSubmissionController;
  private readonly arena: GpuBufferArena;
  private readonly layout: GpuGridLayout;
  private readonly farField: FarFieldCondition;
  private readonly pipelines: GpuSurfacePipelines;
  private readonly surfaceUniforms: readonly GpuSurfaceUniform[];
  private readonly reductionUniforms: readonly GpuReductionUniform[];
  private readonly reductionPlan: GpuGgReductionPlan;
  private readonly report: GPUBuffer;
  readonly generation: number;

  private constructor(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    layout: GpuGridLayout,
    farField: FarFieldCondition,
    params: GGParams,
    tick: number,
    pipelines: GpuSurfacePipelines,
    surfaceUniforms: readonly GpuSurfaceUniform[],
    reductionUniforms: readonly GpuReductionUniform[],
    reductionPlan: GpuGgReductionPlan,
    report: GPUBuffer,
  ) {
    this.device = device;
    this.submissions = submissions;
    this.arena = arena;
    this.layout = layout;
    this.farField = farField;
    this.paramsInternal = params;
    this.tickInternal = tick;
    this.pipelines = pipelines;
    this.surfaceUniforms = surfaceUniforms;
    this.reductionUniforms = reductionUniforms;
    this.reductionPlan = reductionPlan;
    this.report = report;
    this.generation = arena.generation;
  }

  static async create(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    input: GpuGgSurfaceInput,
  ): Promise<GpuGgSurface> {
    if (arena.isDestroyed()) throw new Error("GPU surface arena is destroyed");
    arena.assertDevice(device);
    submissions.assertDevice(device);
    validateGpuBufferPlan(arena.plan);
    if (arena.plan.operator !== "gg") {
      throw new Error("G-G surface requires a gg buffer arena");
    }
    if (arena.generation !== submissions.currentGeneration()) {
      throw new Error("GPU surface generation disagrees with the submission controller");
    }
    if (claimedSurfaceArenas.has(arena)) {
      throw new Error("GPU G-G surface arena is already claimed");
    }
    const layout = createGpuGridLayout(arena.plan.layout.dims);
    const boundaryMass = copyFloat32(
      input.initialBoundaryMass,
      "initialBoundaryMass",
    );
    if (boundaryMass.length !== layout.cellCount) {
      throw new Error("initialBoundaryMass length does not match the GPU grid");
    }
    for (let index = 0; index < boundaryMass.length; index++) {
      if (!Number.isFinite(boundaryMass[index]) || boundaryMass[index] < 0) {
        throw new Error(`initialBoundaryMass must be finite and nonnegative at ${index}`);
      }
    }
    const boundaryIndices = copyUint32(
      input.initialBoundaryIndices,
      "initialBoundaryIndices",
    );
    if (boundaryIndices.length > layout.cellCount) {
      throw new Error("initialBoundaryIndices exceeds the GPU grid");
    }
    requireU32(input.attachedCount, "attachedCount");
    requireU32(input.tick, "tick");
    if (input.farField !== "reflecting" && input.farField !== "dirichlet") {
      throw new Error("farField must be reflecting or dirichlet");
    }
    const params = snapshotParams(input.params);
    claimedSurfaceArenas.add(arena);
    const surfaceUniforms: GpuSurfaceUniform[] = [];
    const reductionUniforms: GpuReductionUniform[] = [];
    let report: GPUBuffer | null = null;
    let arenaUploadStarted = false;
    try {
      const pipelines = await createPipelines(device);
      validateGpuBufferPlan(arena.plan);
      if (arena.generation !== submissions.currentGeneration()) {
        throw new Error(
          "GPU surface generation became stale during pipeline construction",
        );
      }
      const flags =
        input.farField === "dirichlet" ? GPU_GG_SURFACE_FLAG_DIRICHLET : 0;
      for (const range of planGpuDispatchRanges(layout.cellCount)) {
        const buffer = device.createBuffer({
          label: `vcc:gg-surface:${arena.generation}:uniform:${range.baseCell}`,
          size: GPU_GG_SURFACE_UNIFORM_BYTES,
          usage: GPU_UNIFORM_BUFFER_USAGE,
        });
        surfaceUniforms.push({ range, buffer });
        device.queue.writeBuffer(
          buffer,
          0,
          encodeGpuGgSurfaceUniforms({
            layout,
            baseCell: range.baseCell,
            generation: arena.generation,
            tick: input.tick,
            inputBase: 0,
            inputCount: layout.cellCount,
            outputBase: 0,
            flags,
            params,
          }),
        );
      }
      const reductionPlan = planGpuGgClampReduction(layout.cellCount);
      for (const dispatch of reductionPlan.dispatches) {
        const buffer = device.createBuffer({
          label:
            `vcc:gg-surface:${arena.generation}:reduction:` +
            `${dispatch.source}:${dispatch.inputBase}`,
          size: GPU_GG_SURFACE_UNIFORM_BYTES,
          usage: GPU_UNIFORM_BUFFER_USAGE,
        });
        reductionUniforms.push({ dispatch, buffer });
        device.queue.writeBuffer(
          buffer,
          0,
          encodeGpuGgSurfaceUniforms({
            layout,
            baseCell: 0,
            generation: arena.generation,
            tick: input.tick,
            inputBase: dispatch.inputBase,
            inputCount: dispatch.inputCount,
            outputBase: dispatch.outputBase,
            flags,
            params,
          }),
        );
      }
      report = device.createBuffer({
        label: `vcc:gg-surface:${arena.generation}:report`,
        size: GPU_GG_CYCLE_REPORT_BYTES,
        usage: GPU_CELL_BUFFER_USAGE,
      });
      const reportBytes = new ArrayBuffer(GPU_GG_CYCLE_REPORT_BYTES);
      const reportView = new DataView(reportBytes);
      reportView.setUint32(0, boundaryIndices.length, true);
      reportView.setUint32(4, input.attachedCount, true);
      device.queue.writeBuffer(report, 0, reportBytes);
      const paddedBoundary = new Uint32Array(layout.cellCount);
      paddedBoundary.set(boundaryIndices);
      arenaUploadStarted = true;
      arena.upload(device, "ggBoundaryMass", boundaryMass);
      arena.upload(device, "boundaryIndices", paddedBoundary);
      return new GpuGgSurface(
        device,
        submissions,
        arena,
        layout,
        input.farField,
        params,
        input.tick,
        pipelines,
        surfaceUniforms,
        reductionUniforms,
        reductionPlan,
        report,
      );
    } catch (error) {
      for (const entry of surfaceUniforms) entry.buffer.destroy();
      for (const entry of reductionUniforms) entry.buffer.destroy();
      report?.destroy();
      claimedSurfaceArenas.delete(arena);
      if (arenaUploadStarted) arena.destroy();
      throw error;
    }
  }

  params(): GGParams {
    this.assertUsable();
    return snapshotParams(this.paramsInternal);
  }

  tick(): number {
    this.assertUsable();
    return this.tickInternal;
  }

  updateControls(controls: GpuGgSurfaceControls): void {
    this.assertUsable();
    if (this.inFlight) {
      throw new Error("cannot update GPU surface controls while work is in flight");
    }
    const params = snapshotParams(controls.params);
    requireU32(controls.tick, "tick");
    const flags =
      this.farField === "dirichlet" ? GPU_GG_SURFACE_FLAG_DIRICHLET : 0;
    const surfacePayloads = this.surfaceUniforms.map((entry) =>
      encodeGpuGgSurfaceUniforms({
        layout: this.layout,
        baseCell: entry.range.baseCell,
        generation: this.generation,
        tick: controls.tick,
        inputBase: 0,
        inputCount: this.layout.cellCount,
        outputBase: 0,
        flags,
        params,
      }),
    );
    const reductionPayloads = this.reductionUniforms.map((entry) =>
      encodeGpuGgSurfaceUniforms({
        layout: this.layout,
        baseCell: 0,
        generation: this.generation,
        tick: controls.tick,
        inputBase: entry.dispatch.inputBase,
        inputCount: entry.dispatch.inputCount,
        outputBase: entry.dispatch.outputBase,
        flags,
        params,
      }),
    );
    try {
      for (let index = 0; index < this.surfaceUniforms.length; index++) {
        this.device.queue.writeBuffer(
          this.surfaceUniforms[index].buffer,
          0,
          surfacePayloads[index],
        );
      }
      for (let index = 0; index < this.reductionUniforms.length; index++) {
        this.device.queue.writeBuffer(
          this.reductionUniforms[index].buffer,
          0,
          reductionPayloads[index],
        );
      }
      this.paramsInternal = params;
      this.tickInternal = controls.tick;
    } catch (error) {
      this.poison(error);
      throw error;
    }
  }

  async advance(
    vaporName: "ggVaporA" | "ggVaporB",
    label = "gg-surface",
  ): Promise<void> {
    this.assertUsable();
    if (this.inFlight) {
      throw new Error("a GPU G-G surface submission is already in flight");
    }
    if (vaporName !== "ggVaporA" && vaporName !== "ggVaporB") {
      throw new Error("GPU G-G surface requires a recognized vapor buffer");
    }
    this.inFlight = true;
    try {
      const encoder = this.device.createCommandEncoder({
        label: `vcc:${label}:generation-${this.generation}`,
      });
      const pass = encoder.beginComputePass({
        label: `vcc:${label}:stages`,
      });
      const occupancy = this.arena.get("occupancy");
      const wall = this.arena.get("wall");
      const topology = this.arena.get("topology");
      const vapor = this.arena.get(vaporName);
      const boundaryMass = this.arena.get("ggBoundaryMass");
      const boundaryIndices = this.arena.get("boundaryIndices");
      const renderFlags = this.arena.get("renderFlags");
      const scratchA = this.arena.get("scratchScalarA");
      const scratchB = this.arena.get("scratchScalarB");
      const reduction = this.arena.get("reduction");
      const bind = (
        uniform: GPUBuffer,
        fourth: GPUBuffer,
        fifth: GPUBuffer,
      ): GPUBindGroup =>
        this.device.createBindGroup({
          label: `vcc:${label}:bindings`,
          layout: this.pipelines.bindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: uniform } },
            { binding: 1, resource: { buffer: occupancy } },
            { binding: 2, resource: { buffer: wall } },
            { binding: 3, resource: { buffer: topology } },
            { binding: 4, resource: { buffer: fourth } },
            { binding: 5, resource: { buffer: fifth } },
            { binding: 6, resource: { buffer: boundaryIndices } },
            { binding: 7, resource: { buffer: renderFlags } },
            { binding: 8, resource: { buffer: this.report } },
          ],
        });
      const firstUniform = this.surfaceUniforms[0]?.buffer;
      if (firstUniform === undefined) {
        throw new Error("GPU G-G surface has no dispatch uniform");
      }
      pass.setPipeline(this.pipelines.clearCycleReport);
      pass.setBindGroup(0, bind(firstUniform, vapor, boundaryMass));
      pass.dispatchWorkgroups(1);

      if (this.farField === "dirichlet") {
        for (const entry of this.reductionUniforms) {
          const source = this.arena.get(entry.dispatch.source);
          const destination = this.arena.get(entry.dispatch.destination);
          pass.setPipeline(this.pipelines.reduceClamp);
          pass.setBindGroup(0, bind(entry.buffer, source, destination));
          pass.dispatchWorkgroups(entry.dispatch.workgroupCount);
        }
        const finalSource = this.arena.get(this.reductionPlan.finalSource);
        pass.setPipeline(this.pipelines.accumulateClamp);
        pass.setBindGroup(0, bind(firstUniform, finalSource, boundaryMass));
        pass.dispatchWorkgroups(1);
      }

      const dispatchSurface = (pipeline: GPUComputePipeline): void => {
        pass.setPipeline(pipeline);
        for (const entry of this.surfaceUniforms) {
          pass.setBindGroup(0, bind(entry.buffer, vapor, boundaryMass));
          pass.dispatchWorkgroups(entry.range.workgroupCount);
        }
      };
      dispatchSurface(this.pipelines.freezeBoundary);
      dispatchSurface(this.pipelines.decideAttachment);
      dispatchSurface(this.pipelines.meltBoundary);
      dispatchSurface(this.pipelines.applyAttachment);

      pass.setPipeline(this.pipelines.rebuildBoundary);
      pass.setBindGroup(0, bind(firstUniform, scratchB, reduction));
      pass.dispatchWorkgroups(1);

      pass.setPipeline(this.pipelines.publishBoundary);
      for (const entry of this.surfaceUniforms) {
        pass.setBindGroup(0, bind(entry.buffer, scratchB, boundaryMass));
        pass.dispatchWorkgroups(entry.range.workgroupCount);
      }
      pass.end();
      const commandBuffer = encoder.finish({
        label: `vcc:${label}:generation-${this.generation}:commands`,
      });
      await this.submissions.submit(label, this.generation, [commandBuffer]);
    } catch (error) {
      this.poison(error);
      throw error;
    } finally {
      this.inFlight = false;
    }
  }

  reportBuffer(): GPUBuffer {
    this.assertUsable();
    return this.report;
  }

  boundaryIndicesBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("boundaryIndices");
  }

  attachmentIndicesBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("reduction");
  }

  renderFlagsBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("renderFlags");
  }

  topologyBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("topology");
  }

  boundaryMassBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("ggBoundaryMass");
  }

  destroy(): void {
    if (this.destroyed) return;
    if (this.inFlight) {
      throw new Error("cannot destroy GPU G-G surface while work is in flight");
    }
    this.destroyed = true;
    this.releaseOwnedResources(false);
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  private assertUsable(): void {
    if (this.poisonedReason !== null) {
      throw new Error(`GPU G-G surface is poisoned: ${this.poisonedReason}`);
    }
    if (this.destroyed) throw new Error("GPU G-G surface is destroyed");
    if (this.arena.isDestroyed()) throw new Error("GPU surface arena is destroyed");
    if (this.submissions.currentGeneration() !== this.generation) {
      throw new Error("GPU G-G surface generation is stale");
    }
  }

  private poison(error: unknown): void {
    if (this.poisonedReason === null) {
      this.poisonedReason =
        error instanceof Error ? error.message : "unknown GPU surface failure";
    }
    this.destroyed = true;
    this.releaseOwnedResources(true);
  }

  private releaseOwnedResources(destroyArena: boolean): void {
    if (!this.ownedResourcesReleased) {
      this.ownedResourcesReleased = true;
      for (const entry of this.surfaceUniforms) entry.buffer.destroy();
      for (const entry of this.reductionUniforms) entry.buffer.destroy();
      this.report.destroy();
      claimedSurfaceArenas.delete(this.arena);
    }
    if (destroyArena) this.arena.destroy();
  }
}
