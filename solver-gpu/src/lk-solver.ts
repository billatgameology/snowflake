import {
  cSat,
  hexDistance,
  kineticLength,
  mIce,
  nucleationABasal,
  nucleationAPrism,
  sigma0Basal,
  sigma0Prism,
  validateTimelineSchedule,
  vKin,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type LKTimelineEnvironment,
  type NucleationParamSet,
} from "@vcc/core";
import {
  GPU_LK_ERROR_FIXED_POINT,
  GPU_LK_ERROR_INVALID_SURFACE,
  GPU_LK_ERROR_NONFINITE_BOUNDARY,
  GPU_LK_ERROR_NONFINITE_RELAXATION,
  GPU_LK_ERROR_PARTITION,
  GPU_LK_ERROR_TIMELINE,
  GPU_LK_ERROR_TOPOLOGY,
  GPU_LK_FLAG_DIRICHLET,
  GPU_LK_FLAG_TEMPERATURE_CHANGED,
  GPU_LK_RENDER_BOUNDARY,
  GPU_LK_RENDER_NT_SHIFT,
  GPU_LK_RENDER_NZ_SHIFT,
  GPU_LK_REPORT_BYTES,
  GPU_LK_REPORT_WORD,
  GPU_LK_RELAXATION_TRACE_CAPACITY,
  GPU_LK_TOPOLOGY_BOUNDARY,
  GPU_LK_TOPOLOGY_FAR_FIELD,
  GPU_LK_WGSL,
} from "./lk-shaders.ts";
import {
  type GpuLkConversionMetadata,
  type GpuLkConversionSnapshot,
} from "./lk-conversion.ts";
import {
  createGpuGridLayout,
  validateGpuBufferPlan,
  type GpuGridLayout,
} from "./layout.ts";
import {
  GpuReadbackAudit,
  readGpuBuffer,
  type GpuReadbackPurpose,
} from "./readback.ts";
import {
  GPU_CELL_BUFFER_USAGE,
  GPU_UNIFORM_BUFFER_USAGE,
  GpuBufferArena,
} from "./resources.ts";
import {
  GpuSubmissionController,
  planGpuDispatchRanges,
} from "./submission.ts";

const GPU_COMPUTE_STAGE = 0x0004;
const UINT32_MAX = 0xffff_ffff;
const GPU_LK_UNIFORM_BYTES = 160;
const GPU_LK_SEGMENT_SWEEPS = GPU_LK_RELAXATION_TRACE_CAPACITY;
const FLOAT32_EPSILON = 2 ** -23;
const FLOAT32_MIN_SUBNORMAL = 2 ** -149;
const FLOAT32_MIN_NORMAL = 2 ** -126;
const AGGREGATE_V5 = "aggregate-hv-g1h1-v5";

const claimedLkArenas = new WeakSet<GpuBufferArena>();

export type GpuLkConvergenceMode =
  | "fixed-point"
  | "bounded-two-cycle"
  | "incomplete";

export type GpuLkDivergenceStatus =
  | "unavailable"
  | "finite"
  | "zero-exchange-unconverged"
  | "not-applicable";

export interface GpuLkFreshInput {
  readonly surfacePolicy: typeof AGGREGATE_V5;
  readonly initialSigma: Float32Array;
  readonly initialFill: Float32Array;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly topology: Uint32Array;
  readonly initialBoundaryIndices: Uint32Array;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly tick: number;
  readonly simTimeSeconds: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
  readonly fillLedgerIceCells: number;
  readonly closedPlacedFillVaporUnits: number;
  readonly currentTemperatureSegmentStartFillIceCells: number;
  readonly kineticDemand: number;
  readonly saturationClippedFill: number;
  readonly holeFillDeficit: number;
  readonly holeFillCountTotal: number;
  readonly lastMaxFillVelocityMS: number;
}

export interface GpuLkConfiguration {
  readonly surfacePolicy: typeof AGGREGATE_V5;
  readonly dims: Dims;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
}

export interface GpuLkDerivedScales {
  readonly cSatPerCubicMeter: number;
  readonly vKinMS: number;
  readonly x0M: number;
  readonly mIceLedger: number;
  readonly maximumKineticVelocityScaleMS: number;
  readonly maximumKineticFillRateScalePerSecond: number;
}

export interface GpuLkRelaxationTrace {
  readonly smootherDrift: number;
  readonly maxAbsSweepInput: number;
  readonly smootherDriftLimit: number;
}

export interface GpuLkRelaxationReport {
  readonly sweeps: number;
  readonly converged: boolean;
  readonly convergenceMode: GpuLkConvergenceMode;
  readonly residual: number;
  readonly divergenceResidual: number | null;
  readonly divergenceStatus: GpuLkDivergenceStatus;
  readonly completedSweepsAfterMutation: number;
  readonly maximumCurrentStepUlpDistance: number;
  readonly maximumTwoBackUlpDistance: number;
  readonly previousDivergenceStatus: GpuLkDivergenceStatus;
  readonly previousDivergenceResidual: number | null;
  readonly previousPhaseDriftTrace: GpuLkRelaxationTrace | null;
  readonly shellClampDiagnostic: number | null;
  readonly surfaceExchangeDiagnostic: number;
  readonly smootherDriftDiagnostic: number;
  readonly minLocalSurfaceExchangeDiagnostic: number;
  readonly trace: readonly GpuLkRelaxationTrace[];
}

function copyGpuLkRelaxationReport(
  report: GpuLkRelaxationReport,
): GpuLkRelaxationReport {
  return {
    ...report,
    previousPhaseDriftTrace:
      report.previousPhaseDriftTrace === null
        ? null
        : { ...report.previousPhaseDriftTrace },
    trace: report.trace.map((entry) => ({ ...entry })),
  };
}

export interface GpuLkSurfaceReport {
  readonly attachedNow: number;
  readonly maxKineticFillIncrement: number;
  readonly holeFillCount: number;
  readonly deltaTimeSeconds: number;
  readonly stalled: boolean;
  readonly skippedUnconverged: boolean;
  readonly kineticDemand: number;
  readonly placedFill: number;
  readonly saturationClippedFill: number;
  readonly partitionError: number;
  readonly holeFillDeficit: number;
}

export interface GpuLkLedgerReport {
  readonly rule: "LibbrechtKinetics";
  readonly claim: string;
  readonly totalMassBD: null;
  readonly dirichletMeter: null;
  readonly fillLedgerIceCells: number;
  readonly fillLedgerVaporUnits: number;
  readonly closedPlacedFillVaporUnits: number;
  readonly currentTemperatureSegmentStartFillIceCells: number;
  readonly currentTemperatureSegmentMIceLedger: number;
  readonly kineticDemand: number;
  readonly holeFillDeficit: number;
  readonly saturationClippedFill: number;
  readonly lastDivergenceResidual: number | null;
}

export interface GpuLkEnvironmentTransitionReport {
  readonly operator: "LibbrechtKinetics";
  readonly boundary: {
    readonly phase: "completedCycleBoundary";
    readonly completedCycles: number;
    readonly tick: number;
    readonly simTimeSeconds: number;
  };
  readonly beforeEnvironment: LKTimelineEnvironment;
  readonly afterEnvironment: LKTimelineEnvironment;
  readonly densityTransform: {
    readonly temperatureChanged: boolean;
    readonly cSatRatioOldToNew: number;
    readonly activeUnattachedCellCount: number;
    readonly transformedCellCount: number;
    readonly transformedInteriorCellCount: number;
    readonly transformedDirichletShellCellCount: number;
    readonly absoluteNumberDensitySumBefore: number;
    readonly absoluteNumberDensitySumAfter: number;
    readonly maxCellAbsoluteNumberDensityError: number;
    readonly maxCellRelativeNumberDensityError: number;
  };
  readonly reservoir: {
    readonly farField: FarFieldCondition;
    readonly activeUnattachedShellCellCount: number;
    readonly shellReclampPending: boolean;
    readonly shellClampTargetBefore: number;
    readonly shellClampTargetAfter: number;
  };
  readonly derivedBefore: GpuLkDerivedScales;
  readonly derivedAfter: GpuLkDerivedScales;
}

export interface GpuLkEvidenceState {
  readonly sigma: Float32Array;
  readonly previousSigma: Float32Array;
  readonly cycleReference: Float32Array;
  readonly fill: Float32Array;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly topology: Uint32Array;
  readonly boundaryIndices: Uint32Array;
  readonly boundaryAttachmentCoefficient: Float32Array;
  readonly boundarySupersaturation: Float32Array;
  readonly previousBoundarySupersaturation: Float32Array | null;
  readonly opposingSupersaturation: Float32Array;
  readonly renderFlags: Uint32Array;
  readonly attachmentIndices: Uint32Array;
}

export interface GpuLkStressDiagnostics {
  readonly boundaryAttachmentCoefficient: Float32Array;
  readonly boundarySupersaturation: Float32Array;
}

/**
 * What the GPU operator actually applied as noise during the accepted relaxation phase.
 *
 * LK never materializes a noise field: `1 - noiseEpsilon * bit` multiplies the Hertz-Knudsen
 * attachment coefficient inside the boundary solve, so there is no buffer to hand back the way
 * `GpuGgSolver.noiseBuffer()` does. The observable quantity is therefore the operator's own
 * differential: the SAME reconstructed accepted sweep solved once at the configured noise
 * amplitude and once with that amplitude forced to zero. Both coefficient fields are GPU
 * readbacks; nothing here is recomputed on the host.
 */
export interface GpuLkAppliedNoiseObservation {
  /** Interface tick whose noise stream the accepted relaxation phase consumed. */
  readonly tick: number;
  /** Seed and amplitude the operator itself holds, echoed for the record. */
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  /** The operator's own boundary set at the observed phase. */
  readonly boundaryIndices: Uint32Array;
  /** GPU-solved coefficient field at the configured noise amplitude. */
  readonly noisyBoundaryAttachmentCoefficient: Float32Array;
  /** GPU-solved coefficient field with the noise amplitude forced to zero. */
  readonly noiseFreeBoundaryAttachmentCoefficient: Float32Array;
  /** Boundary cells at which the operator's own noise application changed its coefficient. */
  readonly appliedNoiseIndices: Uint32Array;
}

/**
 * Boundary cells at which the noisy and noise-free coefficient fields disagree. Exact by
 * construction: a zero noise bit reuses identical inputs and therefore reproduces the value
 * bit-for-bit, so any disagreement is applied noise and nothing else. `Object.is` is used so a
 * signed-zero difference is reported rather than silently collapsed.
 */
export function deriveGpuLkAppliedNoiseIndices(
  boundaryIndices: Uint32Array,
  noisy: Float32Array,
  noiseFree: Float32Array,
): Uint32Array {
  if (noisy.length !== noiseFree.length) {
    throw new Error("GPU LK applied-noise coefficient fields must share a length");
  }
  const changed: number[] = [];
  for (const index of boundaryIndices) {
    if (index >= noisy.length) {
      throw new Error(`GPU LK applied-noise boundary index ${index} is out of range`);
    }
    if (!Object.is(noisy[index], noiseFree[index])) changed.push(index);
  }
  return Uint32Array.from(changed);
}

interface GpuLkControls {
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxM: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly tick: number;
  readonly farField: FarFieldCondition;
  readonly derived: GpuLkDerivedScales;
}

interface GpuLkUniformValues {
  readonly layout: GpuGridLayout;
  readonly baseCell: number;
  readonly generation: number;
  readonly inputBase: number;
  readonly inputCount: number;
  readonly outputBase: number;
  readonly flags: number;
  readonly activeCellCount: number;
  readonly boundaryCount: number;
  readonly localSweep: number;
  readonly ownerAfter: number;
  readonly captureSlot: number;
  readonly cSatOld: number;
  readonly cSatNew: number;
  readonly densityRatio: number;
  readonly controls: GpuLkControls;
}

interface GpuLkPipelines {
  readonly bindGroupLayout: GPUBindGroupLayout;
  readonly diffuseInPlanePairs: GPUComputePipeline;
  readonly diffuseInPlaneAddLow: GPUComputePipeline;
  readonly diffuseInPlaneAccumulate: GPUComputePipeline;
  readonly diffuseInPlaneDivide: GPUComputePipeline;
  readonly diffuseVerticalNeighborSum: GPUComputePipeline;
  readonly diffuseVerticalProducts: GPUComputePipeline;
  readonly diffuseVerticalCombine: GPUComputePipeline;
  readonly diffuseVerticalMetrics: GPUComputePipeline;
  readonly solveBoundary: GPUComputePipeline;
  readonly measureBoundaryExchange: GPUComputePipeline;
  readonly publishBoundaryValues: GPUComputePipeline;
  readonly clampDirichletShell: GPUComputePipeline;
  readonly measureResidual: GPUComputePipeline;
  readonly snapshotCycleReference: GPUComputePipeline;
  readonly measureCycleUlp: GPUComputePipeline;
  readonly reduceSum: GPUComputePipeline;
  readonly reduceMax: GPUComputePipeline;
  readonly reduceMin: GPUComputePipeline;
  readonly reduceMaxU32: GPUComputePipeline;
  readonly captureScalar: GPUComputePipeline;
  readonly decideConvergence: GPUComputePipeline;
  readonly stressNonlinearBoundary: GPUComputePipeline;
  readonly computeSurfaceRate: GPUComputePipeline;
  readonly prepareSurface: GPUComputePipeline;
  readonly writeSurfaceDemand: GPUComputePipeline;
  readonly writeSurfacePlaced: GPUComputePipeline;
  readonly writeSurfaceClipped: GPUComputePipeline;
  readonly writeSurfacePartition: GPUComputePipeline;
  readonly writeHoleDeficit: GPUComputePipeline;
  readonly applySurfaceDecisions: GPUComputePipeline;
  readonly validateSurfaceClosure: GPUComputePipeline;
  readonly applyAttachmentsOrdered: GPUComputePipeline;
  readonly appendAttachmentNeighbors: GPUComputePipeline;
  readonly publishTopology: GPUComputePipeline;
  readonly preserveAttachmentEvidence: GPUComputePipeline;
  readonly transformTimeline: GPUComputePipeline;
  readonly writeTimelineRelativeError: GPUComputePipeline;
  readonly clearBoundaryCaches: GPUComputePipeline;
}

export type GpuLkCycleState =
  | "boundary"
  | "relaxing"
  | "ready"
  | "advancing"
  | "incomplete"
  | "transitioning";

type ReductionMode = "sum" | "max" | "min" | "max-u32";

interface ReductionDispatch {
  readonly inputBase: number;
  readonly inputCount: number;
  readonly outputBase: number;
  readonly workgroupCount: number;
}

interface ReductionLevel {
  readonly dispatches: readonly ReductionDispatch[];
  readonly outputCount: number;
}

export interface GpuLkBounds {
  readonly iMin: number;
  readonly iMax: number;
  readonly jMin: number;
  readonly jMax: number;
  readonly kMin: number;
  readonly kMax: number;
}

interface DecodedCompactReport {
  readonly errorFlags: number;
  readonly converged: boolean;
  readonly convergenceMode: GpuLkConvergenceMode;
  readonly performedSweeps: number;
  readonly activeOwner: 0 | 1;
  readonly residual: number;
  readonly divergence: number;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
  readonly smootherDrift: number;
  readonly minLocalSurfaceExchange: number;
  readonly maxAbsSweepInput: number;
  readonly boundaryCount: number;
  readonly attachedTotal: number;
  readonly oldBoundaryCount: number;
  readonly attachedNow: number;
  readonly holeFillNow: number;
  readonly maxKineticFillIncrement: number;
  readonly deltaTimeSeconds: number;
  readonly maxRate: number;
  readonly maxRawDemand: number;
  readonly demandTotal: number;
  readonly placedTotal: number;
  readonly clippedTotal: number;
  readonly partitionTotal: number;
  readonly holeFillDeficit: number;
  readonly bounds: GpuLkBounds;
  readonly timelineActiveCount: number;
  readonly timelineShellCount: number;
  readonly densityBefore: number;
  readonly densityAfter: number;
  readonly densityMaxAbsError: number;
  readonly densityMaxRelError: number;
  readonly maximumCurrentStepUlpDistance: number;
  readonly maximumTwoBackUlpDistance: number;
  readonly completedSweepsAfterMutation: number;
  readonly previousDivergenceStatus: GpuLkDivergenceStatus;
  readonly previousDivergenceResidual: number;
  readonly previousDriftBoundPassed: boolean;
  readonly trace: readonly {
    readonly smootherDrift: number;
    readonly maxAbsSweepInput: number;
  }[];
}

const float32LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Float32Array.prototype) as object,
  "length",
)?.get;
const uint32LengthGetter = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint32Array.prototype) as object,
  "length",
)?.get;

function copyFloat32(values: unknown, label: string): Float32Array {
  if (float32LengthGetter === undefined) {
    throw new Error("Float32Array length intrinsic is unavailable");
  }
  let length: number;
  try {
    length = Reflect.apply(float32LengthGetter, values, []) as number;
  } catch {
    throw new Error(`${label} must be a genuine Float32Array`);
  }
  const typed = values as Float32Array;
  const copy = new Float32Array(length);
  for (let index = 0; index < length; index++) copy[index] = typed[index];
  return copy;
}

function copyUint32(values: unknown, label: string): Uint32Array {
  if (uint32LengthGetter === undefined) {
    throw new Error("Uint32Array length intrinsic is unavailable");
  }
  let length: number;
  try {
    length = Reflect.apply(uint32LengthGetter, values, []) as number;
  } catch {
    throw new Error(`${label} must be a genuine Uint32Array`);
  }
  const typed = values as Uint32Array;
  const copy = new Uint32Array(length);
  for (let index = 0; index < length; index++) copy[index] = typed[index];
  return copy;
}

function requireU32(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new Error(`${label} must be a u32-safe integer`);
  }
  return value;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requireNonnegativeFinite(value: number, label: string): number {
  requireFinite(value, label);
  if (value < 0) throw new Error(`${label} must be nonnegative`);
  return value;
}

function requirePositiveFinite(value: number, label: string): number {
  requireFinite(value, label);
  if (value <= 0) throw new Error(`${label} must be positive`);
  return value;
}

function requireF32(value: number, label: string): number {
  requireFinite(value, label);
  const rounded = Math.fround(value);
  if (!Number.isFinite(rounded)) {
    throw new Error(`${label} must be representable as f32`);
  }
  return rounded;
}

function deriveScales(
  tempC: number,
  sigmaInfinity: number,
  pressurePa: number,
  dxM: number,
): GpuLkDerivedScales {
  const cSatPerCubicMeter = cSat(tempC);
  const vKinMS = vKin(tempC);
  const x0M = kineticLength(tempC, pressurePa);
  const mIceLedger = mIce(tempC);
  const maximumKineticVelocityScaleMS = 6 * vKinMS * sigmaInfinity;
  const maximumKineticFillRateScalePerSecond =
    maximumKineticVelocityScaleMS / dxM;
  for (const [label, value] of [
    ["derived cSat", cSatPerCubicMeter],
    ["derived vKin", vKinMS],
    ["derived kinetic length", x0M],
    ["derived ice ledger scale", mIceLedger],
    ["derived maximum kinetic velocity", maximumKineticVelocityScaleMS],
    ["derived maximum kinetic fill rate", maximumKineticFillRateScalePerSecond],
  ] as const) {
    requirePositiveFinite(value, label);
  }
  return {
    cSatPerCubicMeter,
    vKinMS,
    x0M,
    mIceLedger,
    maximumKineticVelocityScaleMS,
    maximumKineticFillRateScalePerSecond,
  };
}

function snapshotEnvironment(value: unknown): LKTimelineEnvironment {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("LK timeline environment must be an object");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = ["sigmaInfinity", "tempC"];
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`LK timeline environment keys must be exactly [${expected.join(", ")}]`);
  }
  return {
    tempC: record.tempC as number,
    sigmaInfinity: record.sigmaInfinity as number,
  };
}

function hasAttachedNeighbor(
  occupancy: Uint32Array,
  layout: GpuGridLayout,
  index: number,
): boolean {
  const { nx, ny, nz } = layout.dims;
  const k = Math.floor(index / layout.plane);
  const remainder = index - k * layout.plane;
  const j = Math.floor(remainder / nx);
  const i = remainder - j * nx;
  return (
    (i + 1 < nx && occupancy[index + 1] !== 0) ||
    (i > 0 && occupancy[index - 1] !== 0) ||
    (j + 1 < ny && occupancy[index + nx] !== 0) ||
    (j > 0 && occupancy[index - nx] !== 0) ||
    (i + 1 < nx && j > 0 && occupancy[index + 1 - nx] !== 0) ||
    (i > 0 && j + 1 < ny && occupancy[index - 1 + nx] !== 0) ||
    (k + 1 < nz && occupancy[index + layout.plane] !== 0) ||
    (k > 0 && occupancy[index - layout.plane] !== 0)
  );
}

function neighborCounts(
  occupancy: Uint32Array,
  layout: GpuGridLayout,
  index: number,
): readonly [number, number] {
  const { nx, ny, nz } = layout.dims;
  const k = Math.floor(index / layout.plane);
  const remainder = index - k * layout.plane;
  const j = Math.floor(remainder / nx);
  const i = remainder - j * nx;
  let nT = 0;
  let nZ = 0;
  if (i + 1 < nx && occupancy[index + 1] !== 0) nT++;
  if (i > 0 && occupancy[index - 1] !== 0) nT++;
  if (j + 1 < ny && occupancy[index + nx] !== 0) nT++;
  if (j > 0 && occupancy[index - nx] !== 0) nT++;
  if (i + 1 < nx && j > 0 && occupancy[index + 1 - nx] !== 0) nT++;
  if (i > 0 && j + 1 < ny && occupancy[index - 1 + nx] !== 0) nT++;
  if (k + 1 < nz && occupancy[index + layout.plane] !== 0) nZ++;
  if (k > 0 && occupancy[index - layout.plane] !== 0) nZ++;
  return [nT, nZ];
}

function validateBoundaryState(
  occupancy: Uint32Array,
  wall: Uint32Array,
  topology: Uint32Array,
  boundaryIndices: Uint32Array,
  layout: GpuGridLayout,
): void {
  const membership = new Uint8Array(layout.cellCount);
  for (let position = 0; position < boundaryIndices.length; position++) {
    const index = boundaryIndices[position];
    if (index >= layout.cellCount) {
      throw new Error(`initial boundary index is out of range at ${position}`);
    }
    if (membership[index] !== 0) {
      throw new Error(`initial boundary index is duplicated: ${index}`);
    }
    if (occupancy[index] !== 0 || wall[index] !== 0) {
      throw new Error(`initial boundary index is blocked: ${index}`);
    }
    if (!hasAttachedNeighbor(occupancy, layout, index)) {
      throw new Error(`initial boundary index has no attached neighbor: ${index}`);
    }
    if ((topology[index] & GPU_LK_TOPOLOGY_BOUNDARY) === 0) {
      throw new Error(`initial topology omits boundary bit at ${index}`);
    }
    membership[index] = 1;
  }
  for (let index = 0; index < layout.cellCount; index++) {
    const expected =
      occupancy[index] === 0 &&
      wall[index] === 0 &&
      hasAttachedNeighbor(occupancy, layout, index);
    if (expected !== (membership[index] !== 0)) {
      throw new Error(`initial boundary membership is incomplete at ${index}`);
    }
    if (
      ((topology[index] & GPU_LK_TOPOLOGY_BOUNDARY) !== 0) !==
      (membership[index] !== 0)
    ) {
      throw new Error(`initial topology boundary bit disagrees at ${index}`);
    }
  }
}

export function validateGpuLkDomainTopology(
  layout: GpuGridLayout,
  wall: Uint32Array,
  topology: Uint32Array,
  domain: DomainShape,
  farField: FarFieldCondition,
  center: readonly [number, number, number],
): void {
  if (
    wall.length !== layout.cellCount ||
    topology.length !== layout.cellCount
  ) {
    throw new Error("GPU LK domain topology lengths must match the grid");
  }
  if (domain !== "box" && domain !== "hexPrism") {
    throw new Error("GPU LK domain topology requires box or hexPrism");
  }
  if (farField !== "dirichlet" && farField !== "reflecting") {
    throw new Error(
      "GPU LK domain topology requires dirichlet or reflecting far field",
    );
  }
  const [ic, jc, kc] = center;
  const { nx, ny, nz } = layout.dims;
  for (const [axis, value, limit] of [
    ["i", ic, nx],
    ["j", jc, ny],
    ["k", kc, nz],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < 0 || value >= limit) {
      throw new Error(`GPU LK domain center ${axis} is invalid`);
    }
  }
  const radius = Math.min(ic, nx - 1 - ic, jc, ny - 1 - jc);
  const halfZ = Math.min(kc, nz - 1 - kc);
  for (let index = 0; index < layout.cellCount; index++) {
    const k = Math.floor(index / layout.plane);
    const remainder = index - k * layout.plane;
    const j = Math.floor(remainder / nx);
    const i = remainder - j * nx;
    const distance = hexDistance(i - ic, j - jc);
    const active =
      domain === "box" ||
      (distance <= radius && Math.abs(k - kc) <= halfZ);
    const expectedWall = active ? 0 : 1;
    if (wall[index] !== expectedWall) {
      throw new Error(`GPU LK wall mask disagrees with ${domain} at ${index}`);
    }
    const onShell =
      domain === "box"
        ? i === 0 ||
          i === nx - 1 ||
          j === 0 ||
          j === ny - 1 ||
          k === 0 ||
          k === nz - 1
        : active &&
          (distance === radius || Math.abs(k - kc) === halfZ);
    const expectedFarField = farField === "dirichlet" && onShell;
    const hasFarField =
      (topology[index] & GPU_LK_TOPOLOGY_FAR_FIELD) !== 0;
    if (hasFarField !== expectedFarField) {
      throw new Error(
        `GPU LK far-field topology disagrees with ${domain}/${farField} at ${index}`,
      );
    }
    if (
      hasFarField &&
      (topology[index] & GPU_LK_TOPOLOGY_BOUNDARY) !== 0
    ) {
      throw new Error(
        `GPU LK far-field and crystal-boundary topology overlap at ${index}`,
      );
    }
  }
}

function initialBounds(
  occupancy: Uint32Array,
  layout: GpuGridLayout,
): { readonly attachedCount: number; readonly bounds: GpuLkBounds } {
  let attachedCount = 0;
  let iMin = layout.dims.nx;
  let iMax = 0;
  let jMin = layout.dims.ny;
  let jMax = 0;
  let kMin = layout.dims.nz;
  let kMax = 0;
  for (let index = 0; index < layout.cellCount; index++) {
    if (occupancy[index] === 0) continue;
    attachedCount++;
    const k = Math.floor(index / layout.plane);
    const remainder = index - k * layout.plane;
    const j = Math.floor(remainder / layout.dims.nx);
    const i = remainder - j * layout.dims.nx;
    iMin = Math.min(iMin, i);
    iMax = Math.max(iMax, i);
    jMin = Math.min(jMin, j);
    jMax = Math.max(jMax, j);
    kMin = Math.min(kMin, k);
    kMax = Math.max(kMax, k);
  }
  return {
    attachedCount,
    bounds: attachedCount === 0
      ? {
          iMin: layout.dims.nx,
          iMax: 0,
          jMin: layout.dims.ny,
          jMax: 0,
          kMin: layout.dims.nz,
          kMax: 0,
        }
      : { iMin, iMax, jMin, jMax, kMin, kMax },
  };
}

function createRenderFlags(
  occupancy: Uint32Array,
  topology: Uint32Array,
  layout: GpuGridLayout,
): Uint32Array {
  const flags = new Uint32Array(layout.cellCount);
  for (let index = 0; index < layout.cellCount; index++) {
    const [nT, nZ] = neighborCounts(occupancy, layout, index);
    flags[index] =
      ((topology[index] & GPU_LK_TOPOLOGY_BOUNDARY) !== 0
        ? GPU_LK_RENDER_BOUNDARY
        : 0) |
      (nT << GPU_LK_RENDER_NT_SHIFT) |
      (nZ << GPU_LK_RENDER_NZ_SHIFT);
  }
  return flags;
}

function planReductionLevels(cellCount: number): readonly ReductionLevel[] {
  requireU32(cellCount, "reduction cellCount");
  if (cellCount === 0) throw new Error("reduction cellCount must be positive");
  const levels: ReductionLevel[] = [];
  let count = cellCount;
  while (count > 1) {
    const dispatches: ReductionDispatch[] = [];
    let outputBase = 0;
    for (const range of planGpuDispatchRanges(count)) {
      dispatches.push({
        inputBase: range.baseCell,
        inputCount: range.cellCount,
        outputBase,
        workgroupCount: range.workgroupCount,
      });
      outputBase += range.workgroupCount;
    }
    levels.push({ dispatches, outputCount: outputBase });
    count = outputBase;
  }
  return levels;
}

function float32SmootherDriftAbsLimit(
  activeCellCount: number,
  maxAbsSweepInput: number,
): number {
  requireU32(activeCellCount, "activeCellCount");
  requireNonnegativeFinite(maxAbsSweepInput, "maxAbsSweepInput");
  if (maxAbsSweepInput === 0) return 0;
  return (
    64 *
    activeCellCount *
    Math.max(FLOAT32_EPSILON * maxAbsSweepInput, FLOAT32_MIN_SUBNORMAL)
  );
}

function validateDivergenceEvidence(
  farField: FarFieldCondition,
  status: GpuLkDivergenceStatus,
  rawResidual: number,
  label: string,
): number | null {
  if (status === "unavailable") {
    if (rawResidual !== 0) {
      throw new Error(`${label} unavailable divergence must carry a zero payload`);
    }
    return null;
  }
  if (status === "not-applicable") {
    if (farField !== "reflecting" || rawResidual !== 0) {
      throw new Error(
        `${label} not-applicable divergence is valid only for reflecting mode`,
      );
    }
    return null;
  }
  if (status === "zero-exchange-unconverged") {
    if (farField !== "dirichlet" || rawResidual !== Infinity) {
      throw new Error(
        `${label} zero-exchange divergence sentinel is inconsistent`,
      );
    }
    return Infinity;
  }
  if (
    farField !== "dirichlet" ||
    !Number.isFinite(rawResidual) ||
    rawResidual < 0
  ) {
    throw new Error(`${label} finite divergence evidence is inconsistent`);
  }
  return rawResidual;
}

function divergenceRequirementPassed(
  farField: FarFieldCondition,
  status: GpuLkDivergenceStatus,
  residual: number | null,
  divTol: number,
): boolean {
  if (farField === "reflecting") {
    return status === "not-applicable" && residual === null;
  }
  return (
    status === "finite" &&
    residual !== null &&
    Number.isFinite(residual) &&
    residual < divTol
  );
}

function encodeUniform(values: GpuLkUniformValues): ArrayBuffer {
  requireU32(values.baseCell, "baseCell");
  requireU32(values.generation, "generation");
  requireU32(values.inputBase, "inputBase");
  requireU32(values.inputCount, "inputCount");
  requireU32(values.outputBase, "outputBase");
  requireU32(values.flags, "flags");
  requireU32(values.activeCellCount, "activeCellCount");
  requireU32(values.boundaryCount, "boundaryCount");
  requireU32(values.localSweep, "localSweep");
  requireU32(values.ownerAfter, "ownerAfter");
  requireU32(values.captureSlot, "captureSlot");
  const { controls } = values;
  const sigma0BasalF32 = requireF32(sigma0Basal(controls.tempC), "sigma0Basal");
  const sigma0PrismF32 = requireF32(sigma0Prism(controls.tempC), "sigma0Prism");
  const prefactorBasalF32 = requireF32(
    nucleationABasal(controls.tempC, controls.paramSet),
    "nucleationABasal",
  );
  const prefactorPrismF32 = requireF32(
    nucleationAPrism(controls.tempC, controls.paramSet),
    "nucleationAPrism",
  );
  const bytes = new ArrayBuffer(GPU_LK_UNIFORM_BYTES);
  const view = new DataView(bytes);
  view.setUint32(0, values.layout.dims.nx, true);
  view.setUint32(4, values.layout.dims.ny, true);
  view.setUint32(8, values.layout.dims.nz, true);
  view.setUint32(12, values.layout.cellCount, true);
  view.setUint32(16, values.layout.plane, true);
  view.setUint32(20, values.baseCell, true);
  view.setUint32(24, values.generation, true);
  view.setUint32(28, controls.tick, true);
  view.setUint32(32, values.inputBase, true);
  view.setUint32(36, values.inputCount, true);
  view.setUint32(40, values.outputBase, true);
  view.setUint32(44, values.flags, true);
  view.setUint32(48, values.activeCellCount, true);
  view.setUint32(52, values.boundaryCount, true);
  view.setUint32(56, controls.rngSeed, true);
  view.setUint32(60, values.localSweep, true);
  view.setFloat32(64, requireF32(controls.sigmaInfinity, "sigmaInfinity"), true);
  view.setFloat32(68, requireF32(controls.relaxTol, "relaxTol"), true);
  view.setFloat32(72, requireF32(controls.divTol, "divTol"), true);
  view.setFloat32(
    76,
    requireF32(controls.dxM / controls.derived.x0M, "dxOverX0"),
    true,
  );
  view.setFloat32(80, sigma0BasalF32, true);
  view.setFloat32(84, sigma0PrismF32, true);
  view.setFloat32(88, prefactorBasalF32, true);
  view.setFloat32(92, prefactorPrismF32, true);
  view.setFloat32(96, requireF32(controls.noiseEpsilon, "noiseEpsilon"), true);
  view.setFloat32(
    100,
    requireF32(controls.derived.vKinMS / controls.dxM, "vKinOverDx"),
    true,
  );
  view.setFloat32(104, requireF32(controls.cflFill, "cflFill"), true);
  view.setFloat32(108, requireF32(values.cSatOld, "cSatOld"), true);
  view.setFloat32(112, requireF32(values.cSatNew, "cSatNew"), true);
  view.setFloat32(116, requireF32(values.densityRatio, "densityRatio"), true);
  view.setUint32(120, values.ownerAfter, true);
  view.setUint32(124, values.captureSlot, true);
  return bytes;
}

function setReportFloat(view: DataView, word: number, value: number): void {
  view.setFloat32(word * 4, value, true);
}

function setReportU32(view: DataView, word: number, value: number): void {
  view.setUint32(word * 4, requireU32(value, `report word ${word}`), true);
}

function decodeConvergenceMode(value: number): GpuLkConvergenceMode {
  if (value === 0) return "incomplete";
  if (value === 1) return "fixed-point";
  if (value === 2) return "bounded-two-cycle";
  throw new Error("GPU LK compact report has an invalid convergence mode");
}

function encodeDivergenceStatus(status: GpuLkDivergenceStatus): number {
  if (status === "unavailable") return 0;
  if (status === "finite") return 1;
  if (status === "zero-exchange-unconverged") return 2;
  return 3;
}

function decodeDivergenceStatus(value: number): GpuLkDivergenceStatus {
  if (value === 0) return "unavailable";
  if (value === 1) return "finite";
  if (value === 2) return "zero-exchange-unconverged";
  if (value === 3) return "not-applicable";
  throw new Error("GPU LK compact report has an invalid divergence status");
}

function encodeReportHeader(values: {
  readonly activeOwner: 0 | 1;
  readonly boundaryCount: number;
  readonly attachedTotal: number;
  readonly oldBoundaryCount?: number;
  readonly bounds: GpuLkBounds;
  readonly relaxation?: GpuLkRelaxationReport | null;
  readonly completedSweepsAfterMutation?: number;
  readonly previousDivergenceStatus?: GpuLkDivergenceStatus;
  readonly previousDivergenceResidual?: number | null;
  readonly previousDriftBoundPassed?: boolean;
}): ArrayBuffer {
  const bytes = new ArrayBuffer(GPU_LK_REPORT_BYTES);
  const view = new DataView(bytes);
  setReportU32(view, GPU_LK_REPORT_WORD.activeOwner, values.activeOwner);
  setReportU32(view, GPU_LK_REPORT_WORD.boundaryCount, values.boundaryCount);
  setReportU32(view, GPU_LK_REPORT_WORD.attachedTotal, values.attachedTotal);
  setReportU32(
    view,
    GPU_LK_REPORT_WORD.oldBoundaryCount,
    values.oldBoundaryCount ?? values.boundaryCount,
  );
  setReportU32(view, GPU_LK_REPORT_WORD.iMin, values.bounds.iMin);
  setReportU32(view, GPU_LK_REPORT_WORD.iMax, values.bounds.iMax);
  setReportU32(view, GPU_LK_REPORT_WORD.jMin, values.bounds.jMin);
  setReportU32(view, GPU_LK_REPORT_WORD.jMax, values.bounds.jMax);
  setReportU32(view, GPU_LK_REPORT_WORD.kMin, values.bounds.kMin);
  setReportU32(view, GPU_LK_REPORT_WORD.kMax, values.bounds.kMax);
  setReportU32(
    view,
    GPU_LK_REPORT_WORD.completedSweepsAfterMutation,
    values.completedSweepsAfterMutation ?? 0,
  );
  setReportU32(
    view,
    GPU_LK_REPORT_WORD.previousDivergenceStatus,
    encodeDivergenceStatus(values.previousDivergenceStatus ?? "unavailable"),
  );
  setReportFloat(
    view,
    GPU_LK_REPORT_WORD.previousDivergenceResidual,
    values.previousDivergenceResidual ?? 0,
  );
  setReportU32(
    view,
    GPU_LK_REPORT_WORD.previousDriftBoundPassed,
    values.previousDriftBoundPassed === true ? 1 : 0,
  );
  if (values.relaxation !== undefined && values.relaxation !== null) {
    const relaxation = values.relaxation;
    setReportU32(
      view,
      GPU_LK_REPORT_WORD.maximumCurrentStepUlpDistance,
      relaxation.maximumCurrentStepUlpDistance,
    );
    setReportU32(
      view,
      GPU_LK_REPORT_WORD.maximumTwoBackUlpDistance,
      relaxation.maximumTwoBackUlpDistance,
    );
    setReportFloat(view, GPU_LK_REPORT_WORD.residual, relaxation.residual);
    setReportFloat(
      view,
      GPU_LK_REPORT_WORD.divergence,
      relaxation.divergenceResidual ?? 0,
    );
    setReportFloat(
      view,
      GPU_LK_REPORT_WORD.shellInjection,
      relaxation.shellClampDiagnostic ?? 0,
    );
    setReportFloat(
      view,
      GPU_LK_REPORT_WORD.surfaceExchange,
      relaxation.surfaceExchangeDiagnostic,
    );
    setReportFloat(
      view,
      GPU_LK_REPORT_WORD.smootherDrift,
      relaxation.smootherDriftDiagnostic,
    );
    setReportFloat(
      view,
      GPU_LK_REPORT_WORD.minLocalSurfaceExchange,
      relaxation.minLocalSurfaceExchangeDiagnostic,
    );
  }
  return bytes;
}

export function decodeGpuLkCompactReport(bytes: ArrayBuffer): DecodedCompactReport {
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== GPU_LK_REPORT_BYTES) {
    throw new Error(`GPU LK compact report must contain ${GPU_LK_REPORT_BYTES} bytes`);
  }
  const view = new DataView(bytes);
  const u32 = (word: number): number => view.getUint32(word * 4, true);
  const f32 = (word: number): number => view.getFloat32(word * 4, true);
  const performedSweeps = u32(GPU_LK_REPORT_WORD.performedSweeps);
  if (performedSweeps > GPU_LK_RELAXATION_TRACE_CAPACITY) {
    throw new Error("GPU LK compact report exceeds the relaxation trace capacity");
  }
  const activeOwner = u32(GPU_LK_REPORT_WORD.activeOwner);
  if (activeOwner !== 0 && activeOwner !== 1) {
    throw new Error("GPU LK compact report has an invalid sigma owner");
  }
  const convergenceMode = decodeConvergenceMode(
    u32(GPU_LK_REPORT_WORD.convergenceMode),
  );
  const converged = u32(GPU_LK_REPORT_WORD.converged);
  if (
    converged > 1 ||
    (converged === 1) !== (convergenceMode !== "incomplete")
  ) {
    throw new Error(
      "GPU LK compact report convergence flag disagrees with its mode",
    );
  }
  const previousDriftBoundPassed = u32(
    GPU_LK_REPORT_WORD.previousDriftBoundPassed,
  );
  if (previousDriftBoundPassed > 1) {
    throw new Error("GPU LK compact report has an invalid prior drift result");
  }
  const trace = new Array<{
    readonly smootherDrift: number;
    readonly maxAbsSweepInput: number;
  }>(performedSweeps);
  for (let index = 0; index < performedSweeps; index++) {
    trace[index] = {
      smootherDrift: f32(GPU_LK_REPORT_WORD.traceBase + index * 2),
      maxAbsSweepInput: f32(GPU_LK_REPORT_WORD.traceBase + index * 2 + 1),
    };
  }
  return {
    errorFlags: u32(GPU_LK_REPORT_WORD.errorFlags),
    converged: converged !== 0,
    convergenceMode,
    performedSweeps,
    activeOwner,
    residual: f32(GPU_LK_REPORT_WORD.residual),
    divergence: f32(GPU_LK_REPORT_WORD.divergence),
    shellInjection: f32(GPU_LK_REPORT_WORD.shellInjection),
    surfaceExchange: f32(GPU_LK_REPORT_WORD.surfaceExchange),
    smootherDrift: f32(GPU_LK_REPORT_WORD.smootherDrift),
    minLocalSurfaceExchange: f32(
      GPU_LK_REPORT_WORD.minLocalSurfaceExchange,
    ),
    maxAbsSweepInput: f32(GPU_LK_REPORT_WORD.maxAbsSweepInput),
    boundaryCount: u32(GPU_LK_REPORT_WORD.boundaryCount),
    attachedTotal: u32(GPU_LK_REPORT_WORD.attachedTotal),
    oldBoundaryCount: u32(GPU_LK_REPORT_WORD.oldBoundaryCount),
    attachedNow: u32(GPU_LK_REPORT_WORD.attachedNow),
    holeFillNow: u32(GPU_LK_REPORT_WORD.holeFillNow),
    maxKineticFillIncrement: f32(
      GPU_LK_REPORT_WORD.maxKineticFillIncrement,
    ),
    deltaTimeSeconds: f32(GPU_LK_REPORT_WORD.deltaTimeSeconds),
    maxRate: f32(GPU_LK_REPORT_WORD.maxRate),
    maxRawDemand: f32(GPU_LK_REPORT_WORD.maxRawDemand),
    demandTotal: f32(GPU_LK_REPORT_WORD.demandTotal),
    placedTotal: f32(GPU_LK_REPORT_WORD.placedTotal),
    clippedTotal: f32(GPU_LK_REPORT_WORD.clippedTotal),
    partitionTotal: f32(GPU_LK_REPORT_WORD.partitionTotal),
    holeFillDeficit: f32(GPU_LK_REPORT_WORD.holeFillDeficit),
    bounds: {
      iMin: u32(GPU_LK_REPORT_WORD.iMin),
      iMax: u32(GPU_LK_REPORT_WORD.iMax),
      jMin: u32(GPU_LK_REPORT_WORD.jMin),
      jMax: u32(GPU_LK_REPORT_WORD.jMax),
      kMin: u32(GPU_LK_REPORT_WORD.kMin),
      kMax: u32(GPU_LK_REPORT_WORD.kMax),
    },
    timelineActiveCount: u32(GPU_LK_REPORT_WORD.timelineActiveCount),
    timelineShellCount: u32(GPU_LK_REPORT_WORD.timelineShellCount),
    densityBefore: f32(GPU_LK_REPORT_WORD.densityBefore),
    densityAfter: f32(GPU_LK_REPORT_WORD.densityAfter),
    densityMaxAbsError: f32(GPU_LK_REPORT_WORD.densityMaxAbsError),
    densityMaxRelError: f32(GPU_LK_REPORT_WORD.densityMaxRelError),
    maximumCurrentStepUlpDistance: u32(
      GPU_LK_REPORT_WORD.maximumCurrentStepUlpDistance,
    ),
    maximumTwoBackUlpDistance: u32(
      GPU_LK_REPORT_WORD.maximumTwoBackUlpDistance,
    ),
    completedSweepsAfterMutation: u32(
      GPU_LK_REPORT_WORD.completedSweepsAfterMutation,
    ),
    previousDivergenceStatus: decodeDivergenceStatus(
      u32(GPU_LK_REPORT_WORD.previousDivergenceStatus),
    ),
    previousDivergenceResidual: f32(
      GPU_LK_REPORT_WORD.previousDivergenceResidual,
    ),
    previousDriftBoundPassed: previousDriftBoundPassed !== 0,
    trace,
  };
}

function explainErrorFlags(flags: number): string {
  const names: string[] = [];
  if ((flags & GPU_LK_ERROR_NONFINITE_BOUNDARY) !== 0) {
    names.push("non-finite boundary solve");
  }
  if ((flags & GPU_LK_ERROR_FIXED_POINT) !== 0) {
    names.push("boundary fixed-point failure");
  }
  if ((flags & GPU_LK_ERROR_NONFINITE_RELAXATION) !== 0) {
    names.push("non-finite relaxation diagnostic");
  }
  if ((flags & GPU_LK_ERROR_INVALID_SURFACE) !== 0) {
    names.push("invalid surface component");
  }
  if ((flags & GPU_LK_ERROR_PARTITION) !== 0) {
    names.push("surface partition failure");
  }
  if ((flags & GPU_LK_ERROR_TOPOLOGY) !== 0) {
    names.push("topology publication failure");
  }
  if ((flags & GPU_LK_ERROR_TIMELINE) !== 0) {
    names.push("timeline transform failure");
  }
  const unknown =
    flags &
    ~(
      GPU_LK_ERROR_NONFINITE_BOUNDARY |
      GPU_LK_ERROR_FIXED_POINT |
      GPU_LK_ERROR_NONFINITE_RELAXATION |
      GPU_LK_ERROR_INVALID_SURFACE |
      GPU_LK_ERROR_PARTITION |
      GPU_LK_ERROR_TOPOLOGY |
      GPU_LK_ERROR_TIMELINE
    );
  if (unknown !== 0) names.push(`unknown bits 0x${unknown.toString(16)}`);
  return names.join(", ");
}

async function createPipelines(device: GPUDevice): Promise<GpuLkPipelines> {
  const module = device.createShaderModule({
    label: "vcc:lk-aggregate-v5",
    code: GPU_LK_WGSL,
  });
  const compilation = await module.getCompilationInfo();
  const errors = compilation.messages.filter((message) => message.type === "error");
  if (errors.length > 0) {
    throw new Error(
      `LK WGSL compilation failed: ${errors
        .map((message) => `${message.lineNum}:${message.linePos}:${message.message}`)
        .join("; ")}`,
    );
  }
  const entries = new Array<GPUBindGroupLayoutEntry>(9);
  entries[0] = {
    binding: 0,
    visibility: GPU_COMPUTE_STAGE,
    buffer: { type: "uniform" },
  };
  for (let binding = 1; binding <= 8; binding++) {
    entries[binding] = {
      binding,
      visibility: GPU_COMPUTE_STAGE,
      buffer: { type: "storage" },
    };
  }
  const bindGroupLayout = device.createBindGroupLayout({
    label: "vcc:lk-bindings",
    entries,
  });
  const pipelineLayout = device.createPipelineLayout({
    label: "vcc:lk-pipeline-layout",
    bindGroupLayouts: [bindGroupLayout],
  });
  const make = (entryPoint: string) =>
    device.createComputePipelineAsync({
      label: `vcc:lk:${entryPoint}`,
      layout: pipelineLayout,
      compute: { module, entryPoint },
    });
  const entryPoints = [
    "diffuseInPlanePairs",
    "diffuseInPlaneAddLow",
    "diffuseInPlaneAccumulate",
    "diffuseInPlaneDivide",
    "diffuseVerticalNeighborSum",
    "diffuseVerticalProducts",
    "diffuseVerticalCombine",
    "diffuseVerticalMetrics",
    "solveBoundary",
    "measureBoundaryExchange",
    "publishBoundaryValues",
    "clampDirichletShell",
    "measureResidual",
    "snapshotCycleReference",
    "measureCycleUlp",
    "reduceSum",
    "reduceMax",
    "reduceMin",
    "reduceMaxU32",
    "captureScalar",
    "decideConvergence",
    "stressNonlinearBoundary",
    "computeSurfaceRate",
    "prepareSurface",
    "writeSurfaceDemand",
    "writeSurfacePlaced",
    "writeSurfaceClipped",
    "writeSurfacePartition",
    "writeHoleDeficit",
    "applySurfaceDecisions",
    "validateSurfaceClosure",
    "applyAttachmentsOrdered",
    "appendAttachmentNeighbors",
    "publishTopology",
    "preserveAttachmentEvidence",
    "transformTimeline",
    "writeTimelineRelativeError",
    "clearBoundaryCaches",
  ] as const;
  const built = await Promise.all(entryPoints.map((entryPoint) => make(entryPoint)));
  const pipelines = Object.fromEntries(
    entryPoints.map((entryPoint, index) => [entryPoint, built[index]]),
  ) as unknown as Omit<GpuLkPipelines, "bindGroupLayout">;
  return { bindGroupLayout, ...pipelines };
}

interface TemporaryGpuResources {
  readonly uniforms: GPUBuffer[];
  readonly uniformCache: Map<string, GPUBuffer>;
}

export class GpuLkSolver {
  private destroyed = false;
  private inFlight = false;
  private poisonedReason: string | null = null;
  private ownedResourcesReleased = false;
  private cycleState: GpuLkCycleState = "boundary";
  private activeOwner: 0 | 1 = 0;
  private tickInternal: number;
  private simTimeSecondsInternal: number;
  private tempCInternal: number;
  private sigmaInfinityInternal: number;
  private derivedInternal: GpuLkDerivedScales;
  private activeCellCountInternal: number;
  private boundaryCountInternal: number;
  private attachedCountInternal: number;
  private boundsInternal: GpuLkBounds;
  private fillLedgerIceCellsInternal: number;
  private closedPlacedFillVaporUnitsInternal: number;
  private currentTemperatureSegmentStartFillIceCellsInternal: number;
  private kineticDemandInternal: number;
  private saturationClippedFillInternal: number;
  private holeFillDeficitInternal: number;
  private holeFillCountTotalInternal: number;
  private lastMaxFillVelocityMSInternal: number;
  private lastRelaxationInternal: GpuLkRelaxationReport | null = null;
  private lastAttachedNowInternal = 0;
  private completedSweepsAfterMutationInternal = 0;
  private previousDivergenceStatusInternal: GpuLkDivergenceStatus =
    "unavailable";
  private previousDivergenceResidualInternal: number | null = null;
  private previousDriftBoundPassedInternal = false;
  private previousDriftTraceInternal: GpuLkRelaxationTrace | null = null;
  private previousBoundaryCacheAvailableInternal = false;
  private readonly device: GPUDevice;
  private readonly submissions: GpuSubmissionController;
  private readonly arena: GpuBufferArena;
  private readonly audit: GpuReadbackAudit;
  private readonly layout: GpuGridLayout;
  private readonly pipelines: GpuLkPipelines;
  private readonly report: GPUBuffer;
  private readonly reductionLevels: readonly ReductionLevel[];
  readonly generation: number;
  readonly surfacePolicy = AGGREGATE_V5;
  readonly dxUm: number;
  readonly dxM: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];

  private constructor(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    audit: GpuReadbackAudit,
    layout: GpuGridLayout,
    pipelines: GpuLkPipelines,
    report: GPUBuffer,
    input: {
      readonly tempC: number;
      readonly sigmaInfinity: number;
      readonly dxUm: number;
      readonly pressurePa: number;
      readonly paramSet: NucleationParamSet;
      readonly cflFill: number;
      readonly relaxTol: number;
      readonly divTol: number;
      readonly relaxMaxSweeps: number;
      readonly rngSeed: number;
      readonly noiseEpsilon: number;
      readonly tick: number;
      readonly simTimeSeconds: number;
      readonly farField: FarFieldCondition;
      readonly domain: DomainShape;
      readonly center: readonly [number, number, number];
      readonly activeCellCount: number;
      readonly boundaryCount: number;
      readonly attachedCount: number;
      readonly bounds: GpuLkBounds;
      readonly fillLedgerIceCells: number;
      readonly closedPlacedFillVaporUnits: number;
      readonly currentTemperatureSegmentStartFillIceCells: number;
      readonly kineticDemand: number;
      readonly saturationClippedFill: number;
      readonly holeFillDeficit: number;
      readonly holeFillCountTotal: number;
      readonly lastMaxFillVelocityMS: number;
      readonly derived: GpuLkDerivedScales;
    },
  ) {
    this.device = device;
    this.submissions = submissions;
    this.arena = arena;
    this.audit = audit;
    this.layout = layout;
    this.pipelines = pipelines;
    this.report = report;
    this.reductionLevels = planReductionLevels(layout.cellCount);
    this.generation = arena.generation;
    this.tempCInternal = input.tempC;
    this.sigmaInfinityInternal = input.sigmaInfinity;
    this.dxUm = input.dxUm;
    this.dxM = input.dxUm * 1e-6;
    this.pressurePa = input.pressurePa;
    this.paramSet = input.paramSet;
    this.cflFill = input.cflFill;
    this.relaxTol = input.relaxTol;
    this.divTol = input.divTol;
    this.relaxMaxSweeps = input.relaxMaxSweeps;
    this.rngSeed = input.rngSeed;
    this.noiseEpsilon = input.noiseEpsilon;
    this.tickInternal = input.tick;
    this.simTimeSecondsInternal = input.simTimeSeconds;
    this.farField = input.farField;
    this.domain = input.domain;
    this.center = input.center;
    this.activeCellCountInternal = input.activeCellCount;
    this.boundaryCountInternal = input.boundaryCount;
    this.attachedCountInternal = input.attachedCount;
    this.boundsInternal = input.bounds;
    this.fillLedgerIceCellsInternal = input.fillLedgerIceCells;
    this.closedPlacedFillVaporUnitsInternal =
      input.closedPlacedFillVaporUnits;
    this.currentTemperatureSegmentStartFillIceCellsInternal =
      input.currentTemperatureSegmentStartFillIceCells;
    this.kineticDemandInternal = input.kineticDemand;
    this.saturationClippedFillInternal = input.saturationClippedFill;
    this.holeFillDeficitInternal = input.holeFillDeficit;
    this.holeFillCountTotalInternal = input.holeFillCountTotal;
    this.lastMaxFillVelocityMSInternal = input.lastMaxFillVelocityMS;
    this.derivedInternal = input.derived;
  }

  static async create(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    audit: GpuReadbackAudit,
    input: GpuLkFreshInput,
  ): Promise<GpuLkSolver> {
    if (arena.isDestroyed()) throw new Error("GPU LK arena is destroyed");
    arena.assertDevice(device);
    submissions.assertDevice(device);
    validateGpuBufferPlan(arena.plan);
    if (arena.plan.operator !== "lk") {
      throw new Error("GpuLkSolver requires an lk buffer arena");
    }
    if (arena.generation !== submissions.currentGeneration()) {
      throw new Error(
        "GPU LK arena generation disagrees with the submission controller",
      );
    }
    if (claimedLkArenas.has(arena)) {
      throw new Error("GPU LK arena is already claimed");
    }
    if (!(audit instanceof GpuReadbackAudit)) {
      throw new Error("GpuLkSolver requires a GpuReadbackAudit");
    }
    if (input === null || typeof input !== "object") {
      throw new Error("GPU LK fresh input must be an object");
    }
    claimedLkArenas.add(arena);
    try {
    const record = input as unknown as Record<string, unknown>;
    if (record.surfacePolicy !== AGGREGATE_V5) {
      throw new Error("GPU LK supports only aggregate-hv-g1h1-v5: the WGSL boundary kernel still sums " +
          "the Eq. 5.35 opposing operands in gather order, so it does not implement the v6 " +
          "canonical order (ADR 0023)");
    }
    const layout = createGpuGridLayout(arena.plan.layout.dims);
    const sigma = copyFloat32(record.initialSigma, "initialSigma");
    const fill = copyFloat32(record.initialFill, "initialFill");
    const occupancy = copyUint32(record.occupancy, "occupancy");
    const wall = copyUint32(record.wall, "wall");
    const topology = copyUint32(record.topology, "topology");
    const boundaryIndices = copyUint32(
      record.initialBoundaryIndices,
      "initialBoundaryIndices",
    );
    if (
      sigma.length !== layout.cellCount ||
      fill.length !== layout.cellCount ||
      occupancy.length !== layout.cellCount ||
      wall.length !== layout.cellCount ||
      topology.length !== layout.cellCount
    ) {
      throw new Error("GPU LK state lengths must match the arena grid");
    }
    if (boundaryIndices.length > layout.cellCount) {
      throw new Error("initialBoundaryIndices exceeds the GPU grid");
    }
    validateBoundaryState(occupancy, wall, topology, boundaryIndices, layout);
    let activeCellCount = 0;
    for (let index = 0; index < layout.cellCount; index++) {
      if (occupancy[index] > 1 || wall[index] > 1) {
        throw new Error(`GPU LK occupancy and wall must be binary at ${index}`);
      }
      if (occupancy[index] !== 0 && wall[index] !== 0) {
        throw new Error(`GPU LK cell cannot be attached and wall at ${index}`);
      }
      if (
        (topology[index] &
          ~(GPU_LK_TOPOLOGY_FAR_FIELD | GPU_LK_TOPOLOGY_BOUNDARY)) !==
        0
      ) {
        throw new Error(`GPU LK topology contains reserved bits at ${index}`);
      }
      const sigmaValue = sigma[index];
      const fillValue = fill[index];
      if (!Number.isFinite(sigmaValue) || !Number.isFinite(fillValue)) {
        throw new Error(`GPU LK fields must be finite at ${index}`);
      }
      if (occupancy[index] !== 0) {
        if (sigmaValue !== 0 || fillValue !== 1) {
          throw new Error(
            `attached GPU LK cell must have sigma=0 and fill=1 at ${index}`,
          );
        }
      } else if (wall[index] !== 0) {
        if (sigmaValue !== 0 || fillValue !== 0) {
          throw new Error(
            `wall GPU LK cell must have sigma=0 and fill=0 at ${index}`,
          );
        }
      } else {
        activeCellCount++;
        if (sigmaValue < -1) {
          throw new Error(`active GPU LK sigma must be at least -1 at ${index}`);
        }
        if (fillValue < 0 || fillValue >= 1) {
          throw new Error(`active GPU LK fill must be in [0,1) at ${index}`);
        }
      }
    }
    const tempC = record.tempC as number;
    const sigmaInfinity = record.sigmaInfinity as number;
    const dxUm = record.dxUm as number;
    const pressurePa = record.pressurePa as number;
    const paramSet = record.paramSet as NucleationParamSet;
    const cflFill = record.cflFill as number;
    const relaxTol = record.relaxTol as number;
    const divTol = record.divTol as number;
    const relaxMaxSweeps = record.relaxMaxSweeps as number;
    const rngSeed = record.rngSeed as number;
    const noiseEpsilon = record.noiseEpsilon as number;
    const tick = record.tick as number;
    const simTimeSeconds = record.simTimeSeconds as number;
    const farField = record.farField as FarFieldCondition;
    const domain = record.domain as DomainShape;
    const centerValue = record.center;
    requireFinite(tempC, "tempC");
    requirePositiveFinite(sigmaInfinity, "sigmaInfinity");
    requirePositiveFinite(dxUm, "dxUm");
    requirePositiveFinite(pressurePa, "pressurePa");
    if (paramSet !== "CAK_A1" && paramSet !== "CAK") {
      throw new Error("paramSet must be CAK_A1 or CAK");
    }
    requirePositiveFinite(cflFill, "cflFill");
    if (cflFill > 1) throw new Error("cflFill must not exceed 1");
    requirePositiveFinite(relaxTol, "relaxTol");
    requirePositiveFinite(divTol, "divTol");
    requireU32(relaxMaxSweeps, "relaxMaxSweeps");
    if (relaxMaxSweeps === 0) throw new Error("relaxMaxSweeps must be positive");
    requireU32(rngSeed, "rngSeed");
    requireU32(tick, "tick");
    requireNonnegativeFinite(simTimeSeconds, "simTimeSeconds");
    requireNonnegativeFinite(noiseEpsilon, "noiseEpsilon");
    if (noiseEpsilon > 1) throw new Error("noiseEpsilon must not exceed 1");
    if (farField !== "dirichlet" && farField !== "reflecting") {
      throw new Error("farField must be dirichlet or reflecting");
    }
    if (domain !== "box" && domain !== "hexPrism") {
      throw new Error("domain must be box or hexPrism");
    }
    if (!Array.isArray(centerValue) || centerValue.length !== 3) {
      throw new Error("center must contain exactly three coordinates");
    }
    const center = [
      centerValue[0] as number,
      centerValue[1] as number,
      centerValue[2] as number,
    ] as const;
    for (let axis = 0; axis < 3; axis++) {
      const limit =
        axis === 0
          ? layout.dims.nx
          : axis === 1
            ? layout.dims.ny
            : layout.dims.nz;
      if (
        !Number.isSafeInteger(center[axis]) ||
        center[axis] < 0 ||
        center[axis] >= limit
      ) {
        throw new Error(`center[${axis}] must be an in-domain integer`);
      }
    }
    validateGpuLkDomainTopology(
      layout,
      wall,
      topology,
      domain,
      farField,
      center,
    );
    const fillLedgerIceCells = record.fillLedgerIceCells as number;
    const closedPlacedFillVaporUnits =
      record.closedPlacedFillVaporUnits as number;
    const currentTemperatureSegmentStartFillIceCells =
      record.currentTemperatureSegmentStartFillIceCells as number;
    const kineticDemand = record.kineticDemand as number;
    const saturationClippedFill = record.saturationClippedFill as number;
    const holeFillDeficit = record.holeFillDeficit as number;
    const holeFillCountTotal = record.holeFillCountTotal as number;
    const lastMaxFillVelocityMS = record.lastMaxFillVelocityMS as number;
    requireNonnegativeFinite(fillLedgerIceCells, "fillLedgerIceCells");
    requireNonnegativeFinite(
      closedPlacedFillVaporUnits,
      "closedPlacedFillVaporUnits",
    );
    requireNonnegativeFinite(
      currentTemperatureSegmentStartFillIceCells,
      "currentTemperatureSegmentStartFillIceCells",
    );
    if (currentTemperatureSegmentStartFillIceCells > fillLedgerIceCells) {
      throw new Error(
        "current temperature segment cannot start after the fill ledger",
      );
    }
    requireNonnegativeFinite(kineticDemand, "kineticDemand");
    requireNonnegativeFinite(
      saturationClippedFill,
      "saturationClippedFill",
    );
    requireNonnegativeFinite(holeFillDeficit, "holeFillDeficit");
    requireU32(holeFillCountTotal, "holeFillCountTotal");
    requireNonnegativeFinite(lastMaxFillVelocityMS, "lastMaxFillVelocityMS");
    const dxM = dxUm * 1e-6;
    const derived = deriveScales(tempC, sigmaInfinity, pressurePa, dxM);
    requireNonnegativeFinite(
      closedPlacedFillVaporUnits +
        (fillLedgerIceCells -
          currentTemperatureSegmentStartFillIceCells) *
          derived.mIceLedger,
      "placed-fill vapor ledger",
    );
    for (const [label, value] of [
      ["sigmaInfinity", sigmaInfinity],
      ["dxOverX0", dxM / derived.x0M],
      ["vKinOverDx", derived.vKinMS / dxM],
      ["cflFill", cflFill],
      ["relaxTol", relaxTol],
      ["divTol", divTol],
      ["noiseEpsilon", noiseEpsilon],
      ["cSat", derived.cSatPerCubicMeter],
    ] as const) {
      requireF32(value, label);
    }
    // These calls validate the source-defined interpolation domain before any GPU mutation.
    requireF32(sigma0Basal(tempC), "sigma0Basal");
    requireF32(sigma0Prism(tempC), "sigma0Prism");
    requireF32(nucleationABasal(tempC, paramSet), "nucleationABasal");
    requireF32(nucleationAPrism(tempC, paramSet), "nucleationAPrism");
    const { attachedCount, bounds } = initialBounds(occupancy, layout);
    if (holeFillCountTotal > attachedCount) {
      throw new Error(
        "holeFillCountTotal cannot exceed the cumulative attached count",
      );
    }
    const paddedBoundary = new Uint32Array(layout.cellCount);
    paddedBoundary.set(boundaryIndices);
    const renderFlags = createRenderFlags(occupancy, topology, layout);
    const zeroFloat = new Float32Array(layout.cellCount);
    let report: GPUBuffer | null = null;
    let uploadStarted = false;
    try {
      const pipelines = await createPipelines(device);
      validateGpuBufferPlan(arena.plan);
      if (arena.generation !== submissions.currentGeneration()) {
        throw new Error(
          "GPU LK generation became stale during pipeline construction",
        );
      }
      report = device.createBuffer({
        label: `vcc:lk:${arena.generation}:report`,
        size: GPU_LK_REPORT_BYTES,
        usage: GPU_CELL_BUFFER_USAGE,
      });
      uploadStarted = true;
      arena.upload(device, "occupancy", occupancy);
      arena.upload(device, "wall", wall);
      arena.upload(device, "topology", topology);
      arena.upload(device, "boundaryIndices", paddedBoundary);
      arena.upload(device, "lkFill", fill);
      arena.upload(device, "lkSigmaA", sigma);
      arena.upload(device, "lkSigmaB", zeroFloat);
      arena.upload(device, "lkCycleReference", zeroFloat);
      arena.upload(device, "lkBoundaryAttachmentCoefficient", zeroFloat);
      arena.upload(device, "lkBoundarySupersaturation", zeroFloat);
      arena.upload(device, "lkOpposingSupersaturation", zeroFloat);
      arena.upload(device, "scratchScalarA", zeroFloat);
      arena.upload(device, "scratchScalarB", zeroFloat);
      arena.upload(device, "noise", zeroFloat);
      arena.upload(device, "reduction", zeroFloat);
      arena.upload(device, "renderFlags", renderFlags);
      device.queue.writeBuffer(
        report,
        0,
        encodeReportHeader({
          activeOwner: 0,
          boundaryCount: boundaryIndices.length,
          attachedTotal: attachedCount,
          bounds,
        }),
      );
      return new GpuLkSolver(
        device,
        submissions,
        arena,
        audit,
        layout,
        pipelines,
        report,
        {
          tempC,
          sigmaInfinity,
          dxUm,
          pressurePa,
          paramSet,
          cflFill,
          relaxTol,
          divTol,
          relaxMaxSweeps,
          rngSeed,
          noiseEpsilon,
          tick,
          simTimeSeconds,
          farField,
          domain,
          center,
          activeCellCount,
          boundaryCount: boundaryIndices.length,
          attachedCount,
          bounds,
          fillLedgerIceCells,
          closedPlacedFillVaporUnits,
          currentTemperatureSegmentStartFillIceCells,
          kineticDemand,
          saturationClippedFill,
          holeFillDeficit,
          holeFillCountTotal,
          lastMaxFillVelocityMS,
          derived,
        },
      );
    } catch (error) {
      report?.destroy();
      if (uploadStarted) arena.destroy();
      throw error;
    }
    } catch (error) {
      claimedLkArenas.delete(arena);
      throw error;
    }
  }

  get dims(): Dims {
    return { ...this.layout.dims };
  }

  get tick(): number {
    this.assertUsable();
    return this.tickInternal;
  }

  get simTimeSeconds(): number {
    this.assertUsable();
    return this.simTimeSecondsInternal;
  }

  get tempC(): number {
    this.assertUsable();
    return this.tempCInternal;
  }

  get sigmaInfinity(): number {
    this.assertUsable();
    return this.sigmaInfinityInternal;
  }

  get lastMaxFillVelocityMS(): number {
    this.assertUsable();
    return this.lastMaxFillVelocityMSInternal;
  }

  timelineEnvironment(): LKTimelineEnvironment {
    this.assertUsable();
    return {
      tempC: this.tempCInternal,
      sigmaInfinity: this.sigmaInfinityInternal,
    };
  }

  derivedScales(): GpuLkDerivedScales {
    this.assertUsable();
    return { ...this.derivedInternal };
  }

  private controls(
    overrides: Partial<
      Pick<GpuLkControls, "tempC" | "sigmaInfinity" | "tick" | "noiseEpsilon">
    > = {},
  ): GpuLkControls {
    const tempC = overrides.tempC ?? this.tempCInternal;
    const sigmaInfinity =
      overrides.sigmaInfinity ?? this.sigmaInfinityInternal;
    const tick = overrides.tick ?? this.tickInternal;
    const derived =
      tempC === this.tempCInternal &&
      sigmaInfinity === this.sigmaInfinityInternal
        ? this.derivedInternal
        : deriveScales(tempC, sigmaInfinity, this.pressurePa, this.dxM);
    return {
      tempC,
      sigmaInfinity,
      dxM: this.dxM,
      pressurePa: this.pressurePa,
      paramSet: this.paramSet,
      cflFill: this.cflFill,
      relaxTol: this.relaxTol,
      divTol: this.divTol,
      rngSeed: this.rngSeed,
      noiseEpsilon: overrides.noiseEpsilon ?? this.noiseEpsilon,
      tick,
      farField: this.farField,
      derived,
    };
  }

  private uniformValues(
    controls: GpuLkControls,
    overrides: Partial<GpuLkUniformValues> = {},
  ): GpuLkUniformValues {
    return {
      layout: this.layout,
      baseCell: 0,
      generation: this.generation,
      inputBase: 0,
      inputCount: this.layout.cellCount,
      outputBase: 0,
      flags: this.farField === "dirichlet" ? GPU_LK_FLAG_DIRICHLET : 0,
      activeCellCount: this.activeCellCountInternal,
      boundaryCount: this.boundaryCountInternal,
      localSweep: 0,
      ownerAfter: this.activeOwner,
      captureSlot: 0,
      cSatOld: controls.derived.cSatPerCubicMeter,
      cSatNew: controls.derived.cSatPerCubicMeter,
      densityRatio: 1,
      controls,
      ...overrides,
    };
  }

  private createTemporaryResources(): TemporaryGpuResources {
    return { uniforms: [], uniformCache: new Map() };
  }

  private destroyTemporaryResources(resources: TemporaryGpuResources): void {
    for (const buffer of resources.uniforms) buffer.destroy();
    resources.uniforms.length = 0;
    resources.uniformCache.clear();
  }

  private temporaryUniform(
    resources: TemporaryGpuResources,
    values: GpuLkUniformValues,
  ): GPUBuffer {
    const key = [
      values.baseCell,
      values.inputBase,
      values.inputCount,
      values.outputBase,
      values.flags,
      values.activeCellCount,
      values.boundaryCount,
      values.localSweep,
      values.ownerAfter,
      values.captureSlot,
      values.cSatOld,
      values.cSatNew,
      values.densityRatio,
      values.controls.tempC,
      values.controls.sigmaInfinity,
      values.controls.tick,
      values.controls.noiseEpsilon,
    ].join("|");
    const cached = resources.uniformCache.get(key);
    if (cached !== undefined) return cached;
    const buffer = this.device.createBuffer({
      label: `vcc:lk:${this.generation}:uniform:${resources.uniforms.length}`,
      size: GPU_LK_UNIFORM_BYTES,
      usage: GPU_UNIFORM_BUFFER_USAGE,
    });
    this.device.queue.writeBuffer(buffer, 0, encodeUniform(values));
    resources.uniforms.push(buffer);
    resources.uniformCache.set(key, buffer);
    return buffer;
  }

  private bind(
    uniform: GPUBuffer,
    requestedNames: readonly string[],
    label: string,
  ): GPUBindGroup {
    const selected: GPUBuffer[] = [];
    const selectedSet = new Set<GPUBuffer>();
    for (const name of requestedNames) {
      const buffer = this.arena.get(name);
      if (selectedSet.has(buffer)) {
        throw new Error(`GPU LK bind group aliases writable buffer ${name}`);
      }
      selected.push(buffer);
      selectedSet.add(buffer);
    }
    for (const name of this.arena.names()) {
      if (selected.length === 7) break;
      const buffer = this.arena.get(name);
      if (!selectedSet.has(buffer)) {
        selected.push(buffer);
        selectedSet.add(buffer);
      }
    }
    if (selected.length !== 7) {
      throw new Error("GPU LK bind group cannot fill seven distinct storage roles");
    }
    return this.device.createBindGroup({
      label: `vcc:${label}:bindings`,
      layout: this.pipelines.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        ...selected.map((buffer, index) => ({
          binding: index + 1,
          resource: { buffer },
        })),
        { binding: 8, resource: { buffer: this.report } },
      ],
    });
  }

  private dispatchRanges(
    pass: GPUComputePassEncoder,
    pipeline: GPUComputePipeline,
    requestedNames: readonly string[],
    controls: GpuLkControls,
    resources: TemporaryGpuResources,
    label: string,
    overrides: Partial<GpuLkUniformValues> = {},
  ): void {
    pass.setPipeline(pipeline);
    for (const range of planGpuDispatchRanges(this.layout.cellCount)) {
      const uniform = this.temporaryUniform(
        resources,
        this.uniformValues(controls, {
          ...overrides,
          baseCell: range.baseCell,
        }),
      );
      pass.setBindGroup(0, this.bind(uniform, requestedNames, label));
      pass.dispatchWorkgroups(range.workgroupCount);
    }
  }

  private reduce(
    pass: GPUComputePassEncoder,
    sourceName: string,
    mode: ReductionMode,
    controls: GpuLkControls,
    resources: TemporaryGpuResources,
    label: string,
  ): string {
    let source = sourceName;
    let levelIndex = 0;
    const pipeline =
      mode === "sum"
        ? this.pipelines.reduceSum
        : mode === "max"
          ? this.pipelines.reduceMax
          : mode === "min"
            ? this.pipelines.reduceMin
            : this.pipelines.reduceMaxU32;
    pass.setPipeline(pipeline);
    for (const level of this.reductionLevels) {
      const destination =
        source === "scratchScalarA" ? "reduction" : "scratchScalarA";
      for (const dispatch of level.dispatches) {
        const uniform = this.temporaryUniform(
          resources,
          this.uniformValues(controls, {
            inputBase: dispatch.inputBase,
            inputCount: dispatch.inputCount,
            outputBase: dispatch.outputBase,
          }),
        );
        pass.setBindGroup(
          0,
          this.bind(
            uniform,
            [source, destination],
            `${label}:reduce-${mode}-${levelIndex}`,
          ),
        );
        pass.dispatchWorkgroups(dispatch.workgroupCount);
      }
      source = destination;
      levelIndex++;
    }
    return source;
  }

  private capture(
    pass: GPUComputePassEncoder,
    sourceName: string,
    reportWord: number,
    controls: GpuLkControls,
    resources: TemporaryGpuResources,
    label: string,
  ): void {
    const uniform = this.temporaryUniform(
      resources,
      this.uniformValues(controls, { captureSlot: reportWord }),
    );
    pass.setPipeline(this.pipelines.captureScalar);
    pass.setBindGroup(0, this.bind(uniform, [sourceName], `${label}:capture`));
    pass.dispatchWorkgroups(1);
  }

  private reduceAndCapture(
    pass: GPUComputePassEncoder,
    sourceName: string,
    mode: ReductionMode,
    reportWord: number,
    controls: GpuLkControls,
    resources: TemporaryGpuResources,
    label: string,
  ): string {
    const finalSource = this.reduce(
      pass,
      sourceName,
      mode,
      controls,
      resources,
      label,
    );
    this.capture(
      pass,
      finalSource,
      reportWord,
      controls,
      resources,
      label,
    );
    return finalSource;
  }

  private activeSigmaName(): "lkSigmaA" | "lkSigmaB" {
    return this.activeOwner === 0 ? "lkSigmaA" : "lkSigmaB";
  }

  private resetRelaxationHistory(): void {
    this.completedSweepsAfterMutationInternal = 0;
    this.previousDivergenceStatusInternal = "unavailable";
    this.previousDivergenceResidualInternal = null;
    this.previousDriftBoundPassedInternal = false;
    this.previousDriftTraceInternal = null;
    this.previousBoundaryCacheAvailableInternal = false;
  }

  private async readCompactReport(label: string): Promise<DecodedCompactReport> {
    const bytes = await readGpuBuffer(
      this.device,
      this.report,
      {
        purpose: "compact-metric",
        label,
        generation: this.generation,
        byteOffset: 0,
        byteLength: GPU_LK_REPORT_BYTES,
      },
      this.audit,
    );
    return decodeGpuLkCompactReport(bytes);
  }

  /**
   * Re-run one relaxation phase's shader stages from `sourceName` into shared scratch, leaving
   * the reconstructed destination field in `reduction`. Exactly the stage order and bindings
   * the accepted sweep used, with the sweep's own source substituted for the live ping-pong
   * pair, so the reconstruction is the deterministic same-arithmetic phase and not a model of
   * it. Callers own the report guard words and the scratch lifetime.
   */
  private encodeReconstructedPhase(
    pass: GPUComputePassEncoder,
    sourceName: string,
    controls: GpuLkControls,
    resources: TemporaryGpuResources,
    label: string,
  ): void {
    const overrides = {
      localSweep: 0,
      ownerAfter: this.activeOwner,
    } satisfies Partial<GpuLkUniformValues>;
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseInPlanePairs,
      [
        "occupancy",
        "wall",
        sourceName,
        "scratchScalarA",
        "scratchScalarB",
        "noise",
      ],
      controls,
      resources,
      `${label}:in-plane-pairs`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseInPlaneAddLow,
      ["occupancy", "wall", sourceName, "scratchScalarA"],
      controls,
      resources,
      `${label}:in-plane-add-low`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseInPlaneAccumulate,
      ["occupancy", "wall", "scratchScalarA", "scratchScalarB"],
      controls,
      resources,
      `${label}:in-plane-add-middle`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseInPlaneAccumulate,
      ["occupancy", "wall", "scratchScalarA", "noise"],
      controls,
      resources,
      `${label}:in-plane-add-high`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseInPlaneDivide,
      ["occupancy", "wall", "scratchScalarA"],
      controls,
      resources,
      `${label}:in-plane-divide`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseVerticalNeighborSum,
      [
        "occupancy",
        "wall",
        "scratchScalarA",
        sourceName,
        "scratchScalarB",
        "noise",
      ],
      controls,
      resources,
      `${label}:vertical-neighbor-sum`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseVerticalProducts,
      [
        "occupancy",
        "wall",
        "scratchScalarA",
        "scratchScalarB",
        "reduction",
      ],
      controls,
      resources,
      `${label}:vertical-products`,
      overrides,
    );
    this.dispatchRanges(
      pass,
      this.pipelines.diffuseVerticalCombine,
      ["occupancy", "wall", "reduction", "scratchScalarB"],
      controls,
      resources,
      `${label}:vertical-combine`,
      overrides,
    );
  }

  /**
   * Solve the aggregate boundary on the field left in `reduction` by
   * `encodeReconstructedPhase`, writing the attachment coefficient into `scratchScalarA`.
   */
  private encodeReconstructedBoundarySolve(
    pass: GPUComputePassEncoder,
    controls: GpuLkControls,
    resources: TemporaryGpuResources,
    label: string,
  ): void {
    this.dispatchRanges(
      pass,
      this.pipelines.solveBoundary,
      [
        "occupancy",
        "wall",
        "topology",
        "reduction",
        "scratchScalarA",
        "scratchScalarB",
        "noise",
      ],
      controls,
      resources,
      `${label}:boundary-solve`,
      { localSweep: 0, ownerAfter: this.activeOwner },
    );
  }

  private async reconstructPreviousBoundaryCache(label: string): Promise<void> {
    const acceptedReportBytes = await readGpuBuffer(
      this.device,
      this.report,
      {
        purpose: "compact-metric",
        label: `${label}:accepted-report-snapshot`,
        generation: this.generation,
        byteOffset: 0,
        byteLength: GPU_LK_REPORT_BYTES,
      },
      this.audit,
    );
    const resources = this.createTemporaryResources();
    try {
      this.device.queue.writeBuffer(
        this.report,
        GPU_LK_REPORT_WORD.converged * Uint32Array.BYTES_PER_ELEMENT,
        new Uint32Array([0]),
      );
      this.device.queue.writeBuffer(
        this.report,
        GPU_LK_REPORT_WORD.convergenceMode *
          Uint32Array.BYTES_PER_ELEMENT,
        new Uint32Array([0]),
      );
      const controls = this.controls();
      const overrides = {
        localSweep: 0,
        ownerAfter: this.activeOwner,
      } satisfies Partial<GpuLkUniformValues>;
      const encoder = this.device.createCommandEncoder({
        label: `vcc:${label}:previous-boundary-cache`,
      });
      const pass = encoder.beginComputePass({
        label: `vcc:${label}:previous-boundary-cache:stages`,
      });
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseInPlanePairs,
        [
          "occupancy",
          "wall",
          "lkCycleReference",
          "scratchScalarA",
          "scratchScalarB",
          "noise",
        ],
        controls,
        resources,
        `${label}:previous-in-plane-pairs`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseInPlaneAddLow,
        ["occupancy", "wall", "lkCycleReference", "scratchScalarA"],
        controls,
        resources,
        `${label}:previous-in-plane-add-low`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseInPlaneAccumulate,
        ["occupancy", "wall", "scratchScalarA", "scratchScalarB"],
        controls,
        resources,
        `${label}:previous-in-plane-add-middle`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseInPlaneAccumulate,
        ["occupancy", "wall", "scratchScalarA", "noise"],
        controls,
        resources,
        `${label}:previous-in-plane-add-high`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseInPlaneDivide,
        ["occupancy", "wall", "scratchScalarA"],
        controls,
        resources,
        `${label}:previous-in-plane-divide`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseVerticalNeighborSum,
        [
          "occupancy",
          "wall",
          "scratchScalarA",
          "lkCycleReference",
          "scratchScalarB",
          "noise",
        ],
        controls,
        resources,
        `${label}:previous-vertical-neighbor-sum`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseVerticalProducts,
        [
          "occupancy",
          "wall",
          "scratchScalarA",
          "scratchScalarB",
          "reduction",
        ],
        controls,
        resources,
        `${label}:previous-vertical-products`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.diffuseVerticalCombine,
        ["occupancy", "wall", "reduction", "scratchScalarB"],
        controls,
        resources,
        `${label}:previous-vertical-combine`,
        overrides,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.solveBoundary,
        [
          "occupancy",
          "wall",
          "topology",
          "reduction",
          "scratchScalarA",
          "scratchScalarB",
          "noise",
        ],
        controls,
        resources,
        `${label}:previous-boundary-solve`,
        overrides,
      );
      pass.end();
      await this.submissions.submit(
        `${label}:previous-boundary-cache`,
        this.generation,
        [encoder.finish()],
      );
      const report = await this.readCompactReport(
        `${label}:previous-boundary-cache:report`,
      );
      if (report.errorFlags !== 0) {
        throw new Error(
          "GPU LK previous-phase cache reconstruction failed: " +
            explainErrorFlags(report.errorFlags),
        );
      }
      this.previousBoundaryCacheAvailableInternal = true;
    } finally {
      this.device.queue.writeBuffer(this.report, 0, acceptedReportBytes);
      this.destroyTemporaryResources(resources);
    }
  }

  async relaxField(label = "lk-relaxation"): Promise<GpuLkRelaxationReport> {
    this.assertUsable();
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK relaxation label is required");
    }
    if (
      (this.cycleState !== "boundary" && this.cycleState !== "incomplete") ||
      this.inFlight
    ) {
      throw new Error(
        `GPU LK relaxation is not allowed in state ${this.cycleState}`,
      );
    }
    this.inFlight = true;
    this.cycleState = "relaxing";
    this.lastRelaxationInternal = null;
    this.previousBoundaryCacheAvailableInternal = false;
    let totalSweeps = 0;
    let finalReport: DecodedCompactReport | null = null;
    let finalTrace: readonly GpuLkRelaxationTrace[] = [];
    const completeTrace: GpuLkRelaxationTrace[] = [];
    let finalPreviousDriftTrace: GpuLkRelaxationTrace | null = null;
    try {
      while (totalSweeps < this.relaxMaxSweeps) {
        const segmentSweeps = Math.min(
          GPU_LK_SEGMENT_SWEEPS,
          this.relaxMaxSweeps - totalSweeps,
        );
        this.device.queue.writeBuffer(
          this.report,
          0,
          encodeReportHeader({
            activeOwner: this.activeOwner,
            boundaryCount: this.boundaryCountInternal,
            attachedTotal: this.attachedCountInternal,
            bounds: this.boundsInternal,
            completedSweepsAfterMutation:
              this.completedSweepsAfterMutationInternal,
            previousDivergenceStatus:
              this.previousDivergenceStatusInternal,
            previousDivergenceResidual:
              this.previousDivergenceResidualInternal,
            previousDriftBoundPassed:
              this.previousDriftBoundPassedInternal,
          }),
        );
        const resources = this.createTemporaryResources();
        try {
          const controls = this.controls();
          const encoder = this.device.createCommandEncoder({
            label: `vcc:${label}:segment-${totalSweeps}`,
          });
          const pass = encoder.beginComputePass({
            label: `vcc:${label}:segment-${totalSweeps}:stages`,
          });
          let encodedOwner = this.activeOwner;
          for (let localSweep = 0; localSweep < segmentSweeps; localSweep++) {
            const sourceName =
              encodedOwner === 0 ? "lkSigmaA" : "lkSigmaB";
            const destinationName =
              encodedOwner === 0 ? "lkSigmaB" : "lkSigmaA";
            const ownerAfter: 0 | 1 = encodedOwner === 0 ? 1 : 0;
            const sweepOverrides = {
              localSweep,
              ownerAfter,
            } satisfies Partial<GpuLkUniformValues>;
            this.dispatchRanges(
              pass,
              this.pipelines.snapshotCycleReference,
              [destinationName, "lkCycleReference"],
              controls,
              resources,
              `${label}:cycle-reference`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseInPlanePairs,
              [
                "occupancy",
                "wall",
                sourceName,
                "scratchScalarA",
                destinationName,
                "scratchScalarB",
              ],
              controls,
              resources,
              `${label}:in-plane-pairs`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseInPlaneAddLow,
              ["occupancy", "wall", sourceName, "scratchScalarA"],
              controls,
              resources,
              `${label}:in-plane-add-low`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseInPlaneAccumulate,
              ["occupancy", "wall", "scratchScalarA", destinationName],
              controls,
              resources,
              `${label}:in-plane-add-middle`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseInPlaneAccumulate,
              ["occupancy", "wall", "scratchScalarA", "scratchScalarB"],
              controls,
              resources,
              `${label}:in-plane-add-high`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseInPlaneDivide,
              ["occupancy", "wall", "scratchScalarA"],
              controls,
              resources,
              `${label}:in-plane-divide`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseVerticalNeighborSum,
              [
                "occupancy",
                "wall",
                "scratchScalarA",
                sourceName,
                "scratchScalarB",
                "noise",
              ],
              controls,
              resources,
              `${label}:vertical-neighbor-sum`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseVerticalProducts,
              [
                "occupancy",
                "wall",
                "scratchScalarA",
                "scratchScalarB",
                destinationName,
              ],
              controls,
              resources,
              `${label}:vertical-products`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseVerticalCombine,
              [
                "occupancy",
                "wall",
                destinationName,
                "scratchScalarB",
              ],
              controls,
              resources,
              `${label}:vertical-combine`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.diffuseVerticalMetrics,
              [
                "occupancy",
                "wall",
                destinationName,
                sourceName,
                "scratchScalarB",
              ],
              controls,
              resources,
              `${label}:vertical-metrics`,
              sweepOverrides,
            );
            this.reduceAndCapture(
              pass,
              "scratchScalarB",
              "sum",
              GPU_LK_REPORT_WORD.rawDrift,
              controls,
              resources,
              `${label}:drift`,
            );
            this.reduceAndCapture(
              pass,
              "noise",
              "max",
              GPU_LK_REPORT_WORD.rawMaxAbsSweepInput,
              controls,
              resources,
              `${label}:max-input`,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.solveBoundary,
              [
                "occupancy",
                "wall",
                "topology",
                destinationName,
                "lkBoundaryAttachmentCoefficient",
                "lkBoundarySupersaturation",
                "lkOpposingSupersaturation",
              ],
              controls,
              resources,
              `${label}:boundary-solve`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.measureBoundaryExchange,
              [
                "topology",
                destinationName,
                "lkBoundarySupersaturation",
                "scratchScalarB",
                "noise",
              ],
              controls,
              resources,
              `${label}:boundary-exchange`,
              sweepOverrides,
            );
            this.reduceAndCapture(
              pass,
              "scratchScalarB",
              "sum",
              GPU_LK_REPORT_WORD.rawSurfaceExchange,
              controls,
              resources,
              `${label}:exchange-sum`,
            );
            this.reduceAndCapture(
              pass,
              "noise",
              "min",
              GPU_LK_REPORT_WORD.rawMinLocalSurfaceExchange,
              controls,
              resources,
              `${label}:exchange-min`,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.publishBoundaryValues,
              [
                "topology",
                destinationName,
                "lkBoundarySupersaturation",
              ],
              controls,
              resources,
              `${label}:boundary-publish`,
              sweepOverrides,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.clampDirichletShell,
              [
                "occupancy",
                "wall",
                "topology",
                destinationName,
                "scratchScalarB",
              ],
              controls,
              resources,
              `${label}:shell-clamp`,
              sweepOverrides,
            );
            this.reduceAndCapture(
              pass,
              "scratchScalarB",
              "sum",
              GPU_LK_REPORT_WORD.rawShellInjection,
              controls,
              resources,
              `${label}:shell-sum`,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.measureResidual,
              [
                "occupancy",
                "wall",
                sourceName,
                destinationName,
                "scratchScalarB",
              ],
              controls,
              resources,
              `${label}:residual`,
              sweepOverrides,
            );
            this.reduceAndCapture(
              pass,
              "scratchScalarB",
              "max",
              GPU_LK_REPORT_WORD.rawResidualMaximum,
              controls,
              resources,
              `${label}:residual-max`,
            );
            this.dispatchRanges(
              pass,
              this.pipelines.measureCycleUlp,
              [
                "occupancy",
                "wall",
                sourceName,
                destinationName,
                "lkCycleReference",
                "scratchScalarA",
                "scratchScalarB",
              ],
              controls,
              resources,
              `${label}:cycle-ulp`,
              sweepOverrides,
            );
            this.reduceAndCapture(
              pass,
              "scratchScalarA",
              "max-u32",
              GPU_LK_REPORT_WORD.maximumCurrentStepUlpDistance,
              controls,
              resources,
              `${label}:current-step-ulp`,
            );
            this.reduceAndCapture(
              pass,
              "scratchScalarB",
              "max-u32",
              GPU_LK_REPORT_WORD.maximumTwoBackUlpDistance,
              controls,
              resources,
              `${label}:two-back-ulp`,
            );
            const decisionUniform = this.temporaryUniform(
              resources,
              this.uniformValues(controls, sweepOverrides),
            );
            pass.setPipeline(this.pipelines.decideConvergence);
            pass.setBindGroup(
              0,
              this.bind(
                decisionUniform,
                [],
                `${label}:decision-${localSweep}`,
              ),
            );
            pass.dispatchWorkgroups(1);
            encodedOwner = ownerAfter;
          }
          pass.end();
          await this.submissions.submit(
            `${label}:segment-${totalSweeps}`,
            this.generation,
            [encoder.finish()],
          );
          const report = await this.readCompactReport(
            `${label}:segment-${totalSweeps}:report`,
          );
          if (report.errorFlags !== 0) {
            throw new Error(
              `GPU LK relaxation failed: ${explainErrorFlags(report.errorFlags)}`,
            );
          }
          if (
            report.performedSweeps <= 0 ||
            report.performedSweeps > segmentSweeps
          ) {
            throw new Error(
              "GPU LK segment reported an impossible executed-sweep count",
            );
          }
          const trace = report.trace.map((entry, index) => {
            if (
              !Number.isFinite(entry.smootherDrift) ||
              !Number.isFinite(entry.maxAbsSweepInput) ||
              entry.maxAbsSweepInput < 0
            ) {
              throw new Error(
                `GPU LK segment trace contains a non-finite value at sweep ${index}`,
              );
            }
            const smootherDriftLimit = float32SmootherDriftAbsLimit(
              this.activeCellCountInternal,
              entry.maxAbsSweepInput,
            );
            if (Math.abs(entry.smootherDrift) > smootherDriftLimit) {
              throw new Error(
                `GPU LK smoother drift ${entry.smootherDrift} exceeds binary32 ` +
                  `roundoff bound ${smootherDriftLimit}`,
              );
            }
            return { ...entry, smootherDriftLimit };
          });
          completeTrace.push(...trace);
          const expectedCompletedSweeps =
            this.completedSweepsAfterMutationInternal +
            report.performedSweeps;
          if (
            !Number.isSafeInteger(expectedCompletedSweeps) ||
            expectedCompletedSweeps > UINT32_MAX ||
            report.completedSweepsAfterMutation !== expectedCompletedSweeps
          ) {
            throw new Error(
              "GPU LK relaxation history count disagrees across a segment",
            );
          }
          if (
            report.previousDriftBoundPassed !==
            this.previousDriftBoundPassedInternal
          ) {
            throw new Error(
              "GPU LK prior drift result changed inside a submission segment",
            );
          }
          const reportedPreviousDivergence =
            validateDivergenceEvidence(
              this.farField,
              report.previousDivergenceStatus,
              report.previousDivergenceResidual,
              "GPU LK previous-phase",
            );
          if (report.convergenceMode === "bounded-two-cycle") {
            finalPreviousDriftTrace =
              trace.length >= 2
                ? trace[trace.length - 2]!
                : this.previousDriftTraceInternal;
            if (finalPreviousDriftTrace === null) {
              throw new Error(
                "GPU LK accepted cycle lacks its previous smoother-drift witness",
              );
            }
          }
          this.completedSweepsAfterMutationInternal =
            report.completedSweepsAfterMutation;
          if (!report.converged) {
            this.previousDivergenceStatusInternal =
              report.previousDivergenceStatus;
            this.previousDivergenceResidualInternal =
              reportedPreviousDivergence;
            this.previousDriftBoundPassedInternal = true;
            this.previousDriftTraceInternal = trace[trace.length - 1]!;
          }
          totalSweeps += report.performedSweeps;
          this.activeOwner = report.activeOwner;
          finalReport = report;
          finalTrace = trace;
          if (report.converged) break;
        } finally {
          this.destroyTemporaryResources(resources);
        }
      }
      if (finalReport === null) {
        throw new Error("GPU LK relaxation produced no compact report");
      }
      for (const [name, value] of [
        ["residual", finalReport.residual],
        ["shell injection", finalReport.shellInjection],
        ["surface exchange", finalReport.surfaceExchange],
        ["smoother drift", finalReport.smootherDrift],
        ["minimum local exchange", finalReport.minLocalSurfaceExchange],
        ["maximum sweep input", finalReport.maxAbsSweepInput],
      ] as const) {
        if (!Number.isFinite(value)) {
          throw new Error(`GPU LK relaxation ${name} must be finite`);
        }
      }
      let divergenceResidual: number | null = null;
      let shellClampDiagnostic: number | null = null;
      let currentDivergenceStatus: GpuLkDivergenceStatus =
        "not-applicable";
      if (this.farField === "dirichlet") {
        divergenceResidual = finalReport.divergence;
        shellClampDiagnostic = finalReport.shellInjection;
        if (!Number.isFinite(divergenceResidual)) {
          const corrected = Math.fround(
            Math.fround(
              Math.fround(finalReport.shellInjection) +
                Math.fround(finalReport.smootherDrift),
            ) - Math.fround(finalReport.surfaceExchange),
          );
          if (
            divergenceResidual !== Infinity ||
            finalReport.surfaceExchange !== 0 ||
            corrected === 0 ||
            finalReport.converged
          ) {
            throw new Error(
              "GPU LK divergence sentinel is inconsistent with zero exchange",
            );
          }
          currentDivergenceStatus = "zero-exchange-unconverged";
        } else {
          if (divergenceResidual < 0) {
            throw new Error("GPU LK divergence residual must be nonnegative");
          }
          currentDivergenceStatus = "finite";
        }
      } else if (finalReport.divergence !== 0) {
        throw new Error(
          "reflecting GPU LK relaxation must not publish a divergence claim",
        );
      }
      const currentDivergencePassed = divergenceRequirementPassed(
        this.farField,
        currentDivergenceStatus,
        divergenceResidual,
        this.divTol,
      );
      const fixedPointSatisfied =
        finalReport.residual < this.relaxTol &&
        currentDivergencePassed;
      const previousDivergenceResidual = validateDivergenceEvidence(
        this.farField,
        finalReport.previousDivergenceStatus,
        finalReport.previousDivergenceResidual,
        "GPU LK accepted previous-phase",
      );
      if (finalReport.convergenceMode === "fixed-point") {
        if (!fixedPointSatisfied) {
          throw new Error(
            "GPU LK fixed-point mode disagrees with the current numerical criteria",
          );
        }
      } else if (finalReport.convergenceMode === "bounded-two-cycle") {
        if (
          fixedPointSatisfied ||
          finalReport.completedSweepsAfterMutation < 2 ||
          finalReport.maximumCurrentStepUlpDistance > 1 ||
          finalReport.maximumTwoBackUlpDistance !== 0 ||
          !currentDivergencePassed ||
          !divergenceRequirementPassed(
            this.farField,
            finalReport.previousDivergenceStatus,
            previousDivergenceResidual,
            this.divTol,
          ) ||
          !finalReport.previousDriftBoundPassed ||
          finalTrace.length === 0
        ) {
          throw new Error(
            "GPU LK bounded-cycle mode disagrees with the exact v5 criteria",
          );
        }
      } else if (fixedPointSatisfied) {
        throw new Error(
          "GPU LK incomplete mode missed an ordinary fixed point",
        );
      }
      const converged = finalReport.convergenceMode !== "incomplete";
      if (completeTrace.length !== totalSweeps) {
        throw new Error(
          "GPU LK complete relaxation trace disagrees with the executed sweep count",
        );
      }
      const result: GpuLkRelaxationReport = {
        sweeps: totalSweeps,
        converged,
        convergenceMode: finalReport.convergenceMode,
        residual: finalReport.residual,
        divergenceResidual,
        divergenceStatus: currentDivergenceStatus,
        completedSweepsAfterMutation:
          finalReport.completedSweepsAfterMutation,
        maximumCurrentStepUlpDistance:
          finalReport.maximumCurrentStepUlpDistance,
        maximumTwoBackUlpDistance:
          finalReport.maximumTwoBackUlpDistance,
        previousDivergenceStatus:
          finalReport.previousDivergenceStatus,
        previousDivergenceResidual,
        previousPhaseDriftTrace: finalPreviousDriftTrace,
        shellClampDiagnostic,
        surfaceExchangeDiagnostic: finalReport.surfaceExchange,
        smootherDriftDiagnostic: finalReport.smootherDrift,
        minLocalSurfaceExchangeDiagnostic:
          finalReport.minLocalSurfaceExchange,
        trace: completeTrace,
      };
      if (result.convergenceMode === "bounded-two-cycle") {
        await this.reconstructPreviousBoundaryCache(label);
      }
      this.lastRelaxationInternal = copyGpuLkRelaxationReport(result);
      this.cycleState = converged ? "ready" : "incomplete";
      return result;
    } catch (error) {
      this.cycleState = "incomplete";
      this.poison(error);
      throw error;
    } finally {
      this.inFlight = false;
    }
  }

  async advanceSurface(label = "lk-surface"): Promise<GpuLkSurfaceReport> {
    this.assertUsable();
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK surface label is required");
    }
    if (
      this.cycleState !== "ready" ||
      this.inFlight ||
      this.lastRelaxationInternal === null ||
      !this.lastRelaxationInternal.converged
    ) {
      throw new Error(
        `GPU LK advanceSurface requires one accepted relaxation (state=${this.cycleState})`,
      );
    }
    if (this.tickInternal === UINT32_MAX) {
      throw new Error("GPU LK surface cannot advance beyond the u32 tick range");
    }
    if (
      this.holeFillCountTotalInternal >
      UINT32_MAX - this.boundaryCountInternal
    ) {
      throw new Error(
        "GPU LK surface could overflow the cumulative hole-fill count",
      );
    }
    this.inFlight = true;
    this.cycleState = "advancing";
    let resources: TemporaryGpuResources | null = null;
    try {
      resources = this.createTemporaryResources();
      this.device.queue.writeBuffer(
        this.report,
        0,
        encodeReportHeader({
          activeOwner: this.activeOwner,
          boundaryCount: this.boundaryCountInternal,
          attachedTotal: this.attachedCountInternal,
          oldBoundaryCount: this.boundaryCountInternal,
          bounds: this.boundsInternal,
          relaxation: this.lastRelaxationInternal,
        }),
      );
      const controls = this.controls();
      const encoder = this.device.createCommandEncoder({
        label: `vcc:${label}`,
      });
      const pass = encoder.beginComputePass({
        label: `vcc:${label}:stages`,
      });
      this.dispatchRanges(
        pass,
        this.pipelines.computeSurfaceRate,
        [
          "topology",
          "lkBoundaryAttachmentCoefficient",
          "lkBoundarySupersaturation",
          "noise",
        ],
        controls,
        resources,
        `${label}:rate`,
      );
      const maxRateSource = this.reduce(
        pass,
        "noise",
        "max",
        controls,
        resources,
        `${label}:max-rate`,
      );
      const prepareUniform = this.temporaryUniform(
        resources,
        this.uniformValues(controls),
      );
      pass.setPipeline(this.pipelines.prepareSurface);
      pass.setBindGroup(
        0,
        this.bind(
          prepareUniform,
          [maxRateSource],
          `${label}:prepare`,
        ),
      );
      pass.dispatchWorkgroups(1);

      this.dispatchRanges(
        pass,
        this.pipelines.writeSurfaceDemand,
        ["topology", "noise", "lkFill", "scratchScalarB"],
        controls,
        resources,
        `${label}:demand`,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "sum",
        GPU_LK_REPORT_WORD.demandTotal,
        controls,
        resources,
        `${label}:demand-sum`,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "max",
        GPU_LK_REPORT_WORD.maxRawDemand,
        controls,
        resources,
        `${label}:demand-max`,
      );

      this.dispatchRanges(
        pass,
        this.pipelines.writeSurfacePlaced,
        ["topology", "noise", "lkFill", "scratchScalarB"],
        controls,
        resources,
        `${label}:placed`,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "sum",
        GPU_LK_REPORT_WORD.placedTotal,
        controls,
        resources,
        `${label}:placed-sum`,
      );

      this.dispatchRanges(
        pass,
        this.pipelines.writeSurfaceClipped,
        ["topology", "noise", "lkFill", "scratchScalarB"],
        controls,
        resources,
        `${label}:clipped`,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "sum",
        GPU_LK_REPORT_WORD.clippedTotal,
        controls,
        resources,
        `${label}:clipped-sum`,
      );

      this.dispatchRanges(
        pass,
        this.pipelines.writeSurfacePartition,
        ["topology", "noise", "lkFill", "scratchScalarB"],
        controls,
        resources,
        `${label}:partition`,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "sum",
        GPU_LK_REPORT_WORD.partitionTotal,
        controls,
        resources,
        `${label}:partition-sum`,
      );

      this.dispatchRanges(
        pass,
        this.pipelines.writeHoleDeficit,
        [
          "topology",
          "occupancy",
          "noise",
          "lkFill",
          "scratchScalarB",
        ],
        controls,
        resources,
        `${label}:hole-deficit`,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "sum",
        GPU_LK_REPORT_WORD.holeFillDeficit,
        controls,
        resources,
        `${label}:hole-deficit-sum`,
      );

      const closureUniform = this.temporaryUniform(
        resources,
        this.uniformValues(controls),
      );
      pass.setPipeline(this.pipelines.validateSurfaceClosure);
      pass.setBindGroup(
        0,
        this.bind(closureUniform, [], `${label}:closure`),
      );
      pass.dispatchWorkgroups(1);

      this.dispatchRanges(
        pass,
        this.pipelines.applySurfaceDecisions,
        ["topology", "occupancy", "noise", "lkFill", "renderFlags"],
        controls,
        resources,
        `${label}:decisions`,
      );

      const serialUniform = this.temporaryUniform(
        resources,
        this.uniformValues(controls),
      );
      pass.setPipeline(this.pipelines.applyAttachmentsOrdered);
      pass.setBindGroup(
        0,
        this.bind(
          serialUniform,
          [
            "topology",
            "occupancy",
            this.activeSigmaName(),
            "boundaryIndices",
            "scratchScalarA",
            "reduction",
            "renderFlags",
          ],
          `${label}:attachments`,
        ),
      );
      pass.dispatchWorkgroups(1);

      pass.setPipeline(this.pipelines.appendAttachmentNeighbors);
      pass.setBindGroup(
        0,
        this.bind(
          serialUniform,
          [
            "topology",
            "occupancy",
            "wall",
            "reduction",
            "scratchScalarA",
          ],
          `${label}:neighbors`,
        ),
      );
      pass.dispatchWorkgroups(1);

      this.dispatchRanges(
        pass,
        this.pipelines.publishTopology,
        [
          "topology",
          "occupancy",
          "wall",
          "scratchScalarA",
          "boundaryIndices",
          "renderFlags",
        ],
        controls,
        resources,
        `${label}:publish`,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.preserveAttachmentEvidence,
        ["boundaryIndices", "reduction"],
        controls,
        resources,
        `${label}:preserve-attachments`,
      );
      pass.end();
      await this.submissions.submit(label, this.generation, [encoder.finish()]);
      const report = await this.readCompactReport(`${label}:report`);
      if (report.errorFlags !== 0) {
        throw new Error(
          `GPU LK surface failed: ${explainErrorFlags(report.errorFlags)}`,
        );
      }
      for (const [name, value] of [
        ["maximum rate", report.maxRate],
        ["delta time", report.deltaTimeSeconds],
        ["maximum demand", report.maxRawDemand],
        ["demand total", report.demandTotal],
        ["placed total", report.placedTotal],
        ["clipped total", report.clippedTotal],
        ["partition total", report.partitionTotal],
        ["hole deficit", report.holeFillDeficit],
      ] as const) {
        if (!Number.isFinite(value) || value < 0 && name !== "partition total") {
          throw new Error(`GPU LK surface ${name} is invalid`);
        }
      }
      const closure = Math.fround(
        Math.fround(
          Math.fround(report.placedTotal) + Math.fround(report.clippedTotal),
        ) - Math.fround(report.demandTotal),
      );
      const closureLimit =
        64 *
        report.oldBoundaryCount *
        FLOAT32_EPSILON *
        Math.max(report.maxRawDemand, FLOAT32_MIN_NORMAL);
      if (Math.abs(closure) > closureLimit) {
        throw new Error(
          `GPU LK global fill partition ${closure} exceeds ${closureLimit}`,
        );
      }
      if (
        report.maxRawDemand >
        Math.fround(this.cflFill) + 8 * FLOAT32_EPSILON * this.cflFill
      ) {
        throw new Error("GPU LK kinetic fill increment exceeds the fill CFL");
      }
      if (
        report.attachedNow > report.oldBoundaryCount ||
        report.holeFillNow > report.attachedNow ||
        report.boundaryCount > this.layout.cellCount ||
        report.attachedTotal !==
          this.attachedCountInternal + report.attachedNow
      ) {
        throw new Error("GPU LK surface reported inconsistent topology counts");
      }
      const stalled = report.maxRate <= 0;
      if (
        stalled !== (report.deltaTimeSeconds === 0) ||
        (stalled && report.maxRawDemand !== 0)
      ) {
        throw new Error("GPU LK stalled state disagrees with rate and time");
      }
      const stagedFillLedgerIceCells =
        this.fillLedgerIceCellsInternal + report.placedTotal;
      const stagedKineticDemand =
        this.kineticDemandInternal + report.demandTotal;
      const stagedSaturationClippedFill =
        this.saturationClippedFillInternal + report.clippedTotal;
      const stagedHoleFillDeficit =
        this.holeFillDeficitInternal + report.holeFillDeficit;
      const stagedHoleFillCountTotal =
        this.holeFillCountTotalInternal + report.holeFillNow;
      const stagedSimTimeSeconds =
        this.simTimeSecondsInternal + report.deltaTimeSeconds;
      const stagedTick = this.tickInternal + 1;
      requireNonnegativeFinite(
        stagedFillLedgerIceCells,
        "staged fill ledger",
      );
      requireNonnegativeFinite(
        stagedKineticDemand,
        "staged kinetic demand",
      );
      requireNonnegativeFinite(
        stagedSaturationClippedFill,
        "staged saturation clipping",
      );
      requireNonnegativeFinite(
        stagedHoleFillDeficit,
        "staged hole-fill deficit",
      );
      requireU32(stagedHoleFillCountTotal, "staged hole-fill count");
      requireNonnegativeFinite(
        stagedSimTimeSeconds,
        "staged simulation time",
      );
      requireU32(stagedTick, "staged tick");
      this.fillLedgerIceCellsInternal = stagedFillLedgerIceCells;
      this.kineticDemandInternal = stagedKineticDemand;
      this.saturationClippedFillInternal =
        stagedSaturationClippedFill;
      this.holeFillDeficitInternal = stagedHoleFillDeficit;
      this.holeFillCountTotalInternal = stagedHoleFillCountTotal;
      this.simTimeSecondsInternal = stagedSimTimeSeconds;
      this.lastMaxFillVelocityMSInternal = report.maxRate * this.dxM;
      this.boundaryCountInternal = report.boundaryCount;
      this.attachedCountInternal = report.attachedTotal;
      this.activeCellCountInternal -= report.attachedNow;
      this.boundsInternal = report.bounds;
      this.lastAttachedNowInternal = report.attachedNow;
      this.tickInternal = stagedTick;
      this.cycleState = "boundary";
      this.resetRelaxationHistory();
      return {
        attachedNow: report.attachedNow,
        maxKineticFillIncrement: report.maxRawDemand,
        holeFillCount: report.holeFillNow,
        deltaTimeSeconds: report.deltaTimeSeconds,
        stalled,
        skippedUnconverged: false,
        kineticDemand: report.demandTotal,
        placedFill: report.placedTotal,
        saturationClippedFill: report.clippedTotal,
        partitionError: report.partitionTotal,
        holeFillDeficit: report.holeFillDeficit,
      };
    } catch (error) {
      this.cycleState = "incomplete";
      this.poison(error);
      throw error;
    } finally {
      if (resources !== null) this.destroyTemporaryResources(resources);
      this.inFlight = false;
    }
  }

  async step(label = "lk-step"): Promise<{
    readonly relaxation: GpuLkRelaxationReport;
    readonly surface: GpuLkSurfaceReport;
  }> {
    this.assertUsable();
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK step label is required");
    }
    if (this.cycleState !== "boundary" && this.cycleState !== "incomplete") {
      throw new Error(`GPU LK step cannot start in state ${this.cycleState}`);
    }
    const relaxation = await this.relaxField(`${label}:relaxation`);
    if (!relaxation.converged) {
      return {
        relaxation,
        surface: {
          attachedNow: 0,
          maxKineticFillIncrement: 0,
          holeFillCount: 0,
          deltaTimeSeconds: 0,
          stalled: false,
          skippedUnconverged: true,
          kineticDemand: 0,
          placedFill: 0,
          saturationClippedFill: 0,
          partitionError: 0,
          holeFillDeficit: 0,
        },
      };
    }
    return {
      relaxation,
      surface: await this.advanceSurface(`${label}:surface`),
    };
  }

  async applyTimelineEnvironment(
    environment: LKTimelineEnvironment,
    label = "lk-timeline",
  ): Promise<GpuLkEnvironmentTransitionReport> {
    this.assertUsable();
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK timeline label is required");
    }
    if (this.cycleState !== "boundary" || this.inFlight) {
      throw new Error(
        `GPU LK timeline environment requires an interface boundary ` +
          `(state=${this.cycleState})`,
      );
    }
    this.inFlight = true;
    this.cycleState = "transitioning";
    const stage = () => {
      const target = snapshotEnvironment(environment);
      const beforeEnvironment = {
        tempC: this.tempCInternal,
        sigmaInfinity: this.sigmaInfinityInternal,
      };
      validateTimelineSchedule({
        version: 1,
        mode: "abrupt",
        operator: "LibbrechtKinetics",
        initialEnvironment: beforeEnvironment,
        events: [
          {
            index: 0,
            operator: "LibbrechtKinetics",
            trigger: { kind: "tick", value: 0 },
            environment: target,
          },
        ],
      });
      requirePositiveFinite(target.sigmaInfinity, "timeline sigmaInfinity");
      const derivedBefore = { ...this.derivedInternal };
      const derivedAfter = deriveScales(
        target.tempC,
        target.sigmaInfinity,
        this.pressurePa,
        this.dxM,
      );
      const temperatureChanged = !Object.is(
        target.tempC,
        this.tempCInternal,
      );
      const stagedClosedPlacedFillVaporUnits = temperatureChanged
        ? this.placedFillVaporUnits()
        : this.closedPlacedFillVaporUnitsInternal;
      requireNonnegativeFinite(
        stagedClosedPlacedFillVaporUnits,
        "timeline closed placed-fill vapor ledger",
      );
      const densityRatio =
        derivedBefore.cSatPerCubicMeter / derivedAfter.cSatPerCubicMeter;
      requirePositiveFinite(densityRatio, "temperature density ratio");
      requireF32(derivedBefore.cSatPerCubicMeter, "old cSat");
      requireF32(derivedAfter.cSatPerCubicMeter, "new cSat");
      requireF32(densityRatio, "temperature density ratio");
      // Validate all target-temperature kinetic interpolation before the first write.
      requireF32(sigma0Basal(target.tempC), "target sigma0Basal");
      requireF32(sigma0Prism(target.tempC), "target sigma0Prism");
      requireF32(
        nucleationABasal(target.tempC, this.paramSet),
        "target nucleationABasal",
      );
      requireF32(
        nucleationAPrism(target.tempC, this.paramSet),
        "target nucleationAPrism",
      );
      return {
        target,
        beforeEnvironment,
        derivedBefore,
        derivedAfter,
        temperatureChanged,
        densityRatio,
        stagedClosedPlacedFillVaporUnits,
      };
    };
    let staged: ReturnType<typeof stage>;
    try {
      staged = stage();
    } catch (error) {
      this.cycleState = "boundary";
      this.inFlight = false;
      throw error;
    }
    const {
      target,
      beforeEnvironment,
      derivedBefore,
      derivedAfter,
      temperatureChanged,
      densityRatio,
      stagedClosedPlacedFillVaporUnits,
    } = staged;
    let resources: TemporaryGpuResources | null = null;
    try {
      resources = this.createTemporaryResources();
      this.device.queue.writeBuffer(
        this.report,
        0,
        encodeReportHeader({
          activeOwner: this.activeOwner,
          boundaryCount: this.boundaryCountInternal,
          attachedTotal: this.attachedCountInternal,
          bounds: this.boundsInternal,
        }),
      );
      const controls = this.controls({
        tempC: target.tempC,
        sigmaInfinity: target.sigmaInfinity,
      });
      const flags =
        (this.farField === "dirichlet" ? GPU_LK_FLAG_DIRICHLET : 0) |
        (temperatureChanged ? GPU_LK_FLAG_TEMPERATURE_CHANGED : 0);
      const timelineOverrides = {
        flags,
        cSatOld: derivedBefore.cSatPerCubicMeter,
        cSatNew: derivedAfter.cSatPerCubicMeter,
        densityRatio,
      } satisfies Partial<GpuLkUniformValues>;
      const encoder = this.device.createCommandEncoder({
        label: `vcc:${label}`,
      });
      const pass = encoder.beginComputePass({
        label: `vcc:${label}:stages`,
      });
      this.dispatchRanges(
        pass,
        this.pipelines.transformTimeline,
        [
          "occupancy",
          "wall",
          "topology",
          this.activeSigmaName(),
          "lkBoundaryAttachmentCoefficient",
          "lkBoundarySupersaturation",
          "lkOpposingSupersaturation",
        ],
        controls,
        resources,
        `${label}:transform`,
        timelineOverrides,
      );
      this.reduceAndCapture(
        pass,
        "lkBoundaryAttachmentCoefficient",
        "sum",
        GPU_LK_REPORT_WORD.densityBefore,
        controls,
        resources,
        `${label}:density-before`,
      );
      this.reduceAndCapture(
        pass,
        "lkBoundarySupersaturation",
        "sum",
        GPU_LK_REPORT_WORD.densityAfter,
        controls,
        resources,
        `${label}:density-after`,
      );
      this.reduceAndCapture(
        pass,
        "lkOpposingSupersaturation",
        "max",
        GPU_LK_REPORT_WORD.densityMaxAbsError,
        controls,
        resources,
        `${label}:density-abs-error`,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.writeTimelineRelativeError,
        [
          "lkBoundaryAttachmentCoefficient",
          "lkOpposingSupersaturation",
          "scratchScalarB",
        ],
        controls,
        resources,
        `${label}:density-rel-error`,
        timelineOverrides,
      );
      this.reduceAndCapture(
        pass,
        "scratchScalarB",
        "max",
        GPU_LK_REPORT_WORD.densityMaxRelError,
        controls,
        resources,
        `${label}:density-rel-error-max`,
      );
      this.dispatchRanges(
        pass,
        this.pipelines.clearBoundaryCaches,
        [
          "lkBoundaryAttachmentCoefficient",
          "lkBoundarySupersaturation",
          "lkOpposingSupersaturation",
        ],
        controls,
        resources,
        `${label}:clear-caches`,
        timelineOverrides,
      );
      pass.end();
      await this.submissions.submit(label, this.generation, [encoder.finish()]);
      const report = await this.readCompactReport(`${label}:report`);
      if (report.errorFlags !== 0) {
        throw new Error(
          `GPU LK timeline failed: ${explainErrorFlags(report.errorFlags)}`,
        );
      }
      for (const [name, value] of [
        ["density before", report.densityBefore],
        ["density after", report.densityAfter],
        ["maximum absolute density error", report.densityMaxAbsError],
        ["maximum relative density error", report.densityMaxRelError],
      ] as const) {
        if (!Number.isFinite(value) || value < 0) {
          throw new Error(`GPU LK timeline ${name} is invalid`);
        }
      }
      if (report.timelineActiveCount !== this.activeCellCountInternal) {
        throw new Error("GPU LK timeline active-cell count changed unexpectedly");
      }
      if (report.timelineShellCount > report.timelineActiveCount) {
        throw new Error("GPU LK timeline shell count exceeds active count");
      }
      const transformedCellCount = temperatureChanged
        ? report.timelineActiveCount
        : 0;
      const transformedDirichletShellCellCount =
        temperatureChanged && this.farField === "dirichlet"
          ? report.timelineShellCount
          : 0;
      const result: GpuLkEnvironmentTransitionReport = {
        operator: "LibbrechtKinetics",
        boundary: {
          phase: "completedCycleBoundary",
          completedCycles: this.tickInternal,
          tick: this.tickInternal,
          simTimeSeconds: this.simTimeSecondsInternal,
        },
        beforeEnvironment,
        afterEnvironment: { ...target },
        densityTransform: {
          temperatureChanged,
          cSatRatioOldToNew: densityRatio,
          activeUnattachedCellCount: report.timelineActiveCount,
          transformedCellCount,
          transformedInteriorCellCount:
            transformedCellCount - transformedDirichletShellCellCount,
          transformedDirichletShellCellCount,
          absoluteNumberDensitySumBefore: report.densityBefore,
          absoluteNumberDensitySumAfter: report.densityAfter,
          maxCellAbsoluteNumberDensityError: report.densityMaxAbsError,
          maxCellRelativeNumberDensityError: report.densityMaxRelError,
        },
        reservoir: {
          farField: this.farField,
          activeUnattachedShellCellCount: report.timelineShellCount,
          shellReclampPending: this.farField === "dirichlet",
          shellClampTargetBefore: this.sigmaInfinityInternal,
          shellClampTargetAfter: target.sigmaInfinity,
        },
        derivedBefore,
        derivedAfter,
      };
      if (temperatureChanged) {
        this.closedPlacedFillVaporUnitsInternal =
          stagedClosedPlacedFillVaporUnits;
        this.currentTemperatureSegmentStartFillIceCellsInternal =
          this.fillLedgerIceCellsInternal;
      }
      this.tempCInternal = target.tempC;
      this.sigmaInfinityInternal = target.sigmaInfinity;
      this.derivedInternal = derivedAfter;
      this.lastRelaxationInternal = null;
      this.lastMaxFillVelocityMSInternal = 0;
      this.cycleState = "boundary";
      this.resetRelaxationHistory();
      return result;
    } catch (error) {
      this.cycleState = "incomplete";
      this.poison(error);
      throw error;
    } finally {
      if (resources !== null) this.destroyTemporaryResources(resources);
      this.inFlight = false;
    }
  }

  private placedFillVaporUnits(): number {
    return (
      this.closedPlacedFillVaporUnitsInternal +
      (this.fillLedgerIceCellsInternal -
        this.currentTemperatureSegmentStartFillIceCellsInternal) *
        this.derivedInternal.mIceLedger
    );
  }

  ledger(): GpuLkLedgerReport {
    this.assertUsable();
    return {
      rule: "LibbrechtKinetics",
      claim:
        "the fill ledger plus recorded saturation clipping integrates exactly the " +
        "geometry-adjusted per-boundary-pixel Hertz-Knudsen demand; placed-fill vapor " +
        "units accumulate each interface step at that step's M_ice; clipping is unapplied " +
        "numerical excess, not deposited ice; Dirichlet convergence requires the signed " +
        "shell-plus-smoother-minus-boundary identity",
      totalMassBD: null,
      dirichletMeter: null,
      fillLedgerIceCells: this.fillLedgerIceCellsInternal,
      fillLedgerVaporUnits: this.placedFillVaporUnits(),
      closedPlacedFillVaporUnits:
        this.closedPlacedFillVaporUnitsInternal,
      currentTemperatureSegmentStartFillIceCells:
        this.currentTemperatureSegmentStartFillIceCellsInternal,
      currentTemperatureSegmentMIceLedger:
        this.derivedInternal.mIceLedger,
      kineticDemand: this.kineticDemandInternal,
      holeFillDeficit: this.holeFillDeficitInternal,
      saturationClippedFill: this.saturationClippedFillInternal,
      lastDivergenceResidual:
        this.farField === "dirichlet"
          ? this.lastRelaxationInternal?.divergenceResidual ?? null
          : null,
    };
  }

  configuration(): GpuLkConfiguration {
    this.assertUsable();
    return {
      surfacePolicy: this.surfacePolicy,
      dims: { ...this.layout.dims },
      dxUm: this.dxUm,
      pressurePa: this.pressurePa,
      paramSet: this.paramSet,
      cflFill: this.cflFill,
      relaxTol: this.relaxTol,
      divTol: this.divTol,
      relaxMaxSweeps: this.relaxMaxSweeps,
      rngSeed: this.rngSeed,
      noiseEpsilon: this.noiseEpsilon,
      farField: this.farField,
      domain: this.domain,
      center: [...this.center],
    };
  }

  bounds(): GpuLkBounds {
    this.assertUsable();
    return { ...this.boundsInternal };
  }

  cyclePhase(): GpuLkCycleState {
    this.assertUsable();
    return this.cycleState;
  }

  activeCellCount(): number {
    this.assertUsable();
    return this.activeCellCountInternal;
  }

  lastAttachmentDelta(): number {
    this.assertUsable();
    return this.lastAttachedNowInternal;
  }

  lastAcceptedRelaxation(): GpuLkRelaxationReport | null {
    this.assertUsable();
    return this.lastRelaxationInternal === null
      ? null
      : copyGpuLkRelaxationReport(this.lastRelaxationInternal);
  }

  boundarySize(): number {
    this.assertUsable();
    return this.boundaryCountInternal;
  }

  attachedCount(): number {
    this.assertUsable();
    return this.attachedCountInternal;
  }

  holeFillCountTotal(): number {
    this.assertUsable();
    return this.holeFillCountTotalInternal;
  }

  largestExtent(): number {
    this.assertUsable();
    if (this.attachedCountInternal === 0) return 0;
    return Math.max(
      this.boundsInternal.iMax - this.boundsInternal.iMin + 1,
      this.boundsInternal.jMax - this.boundsInternal.jMin + 1,
      this.boundsInternal.kMax - this.boundsInternal.kMin + 1,
    );
  }

  domainContact(): boolean {
    this.assertUsable();
    if (this.attachedCountInternal === 0) return false;
    return (
      this.boundsInternal.iMax - this.boundsInternal.iMin + 1 >
        0.65 * this.layout.dims.nx ||
      this.boundsInternal.jMax - this.boundsInternal.jMin + 1 >
        0.65 * this.layout.dims.ny ||
      this.boundsInternal.kMax - this.boundsInternal.kMin + 1 >
        0.65 * this.layout.dims.nz
    );
  }

  async runBoundaryStressDiagnostics(
    input: {
      readonly sigmaOpp: readonly number[];
    },
    label = "lk-stress",
  ): Promise<GpuLkStressDiagnostics> {
    this.assertUsable();
    if (this.inFlight || this.cycleState !== "boundary") {
      throw new Error("GPU LK stress diagnostics require an idle interface boundary");
    }
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK stress label is required");
    }
    this.inFlight = true;
    let sigmaOpp: Float32Array;
    let inputCount: number;
    try {
      const values = (input as unknown as Record<string, unknown>)?.sigmaOpp;
      if (
        !Array.isArray(values) ||
        values.length === 0 ||
        values.length > this.layout.cellCount
      ) {
        throw new Error(
          "GPU LK stress vectors must be nonempty and fit the arena",
        );
      }
      inputCount = values.length;
      sigmaOpp = new Float32Array(this.layout.cellCount);
      for (let index = 0; index < inputCount; index++) {
        sigmaOpp[index] = requireF32(
          values[index],
          `stress sigmaOpp ${index}`,
        );
      }
    } catch (error) {
      this.inFlight = false;
      throw error;
    }
    const zeroFloat = new Float32Array(this.layout.cellCount);
    let resources: TemporaryGpuResources | null = null;
    try {
      resources = this.createTemporaryResources();
      this.arena.upload(this.device, "lkBoundarySupersaturation", sigmaOpp);
      this.arena.upload(
        this.device,
        "lkBoundaryAttachmentCoefficient",
        zeroFloat,
      );
      this.arena.upload(this.device, "lkOpposingSupersaturation", zeroFloat);
      this.device.queue.writeBuffer(
        this.report,
        0,
        encodeReportHeader({
          activeOwner: this.activeOwner,
          boundaryCount: this.boundaryCountInternal,
          attachedTotal: this.attachedCountInternal,
          bounds: this.boundsInternal,
        }),
      );
      const controls = this.controls();
      const encoder = this.device.createCommandEncoder({
        label: `vcc:${label}`,
      });
      const pass = encoder.beginComputePass({ label: `vcc:${label}:stages` });
      this.dispatchRanges(
        pass,
        this.pipelines.stressNonlinearBoundary,
        [
          "lkBoundarySupersaturation",
          "lkBoundaryAttachmentCoefficient",
          "lkOpposingSupersaturation",
        ],
        controls,
        resources,
        `${label}:boundary`,
        { inputCount },
      );
      pass.end();
      await this.submissions.submit(label, this.generation, [encoder.finish()]);
      const compact = await this.readCompactReport(`${label}:report`);
      if (compact.errorFlags !== 0) {
        throw new Error(
          `GPU LK stress diagnostics failed: ${explainErrorFlags(compact.errorFlags)}`,
        );
      }
      const [coefficientBytes, boundarySigmaBytes] = await Promise.all([
        this.readArenaBuffer(
          "lkBoundaryAttachmentCoefficient",
          "evidence-snapshot",
          `${label}:coefficient`,
        ),
        this.readArenaBuffer(
          "lkOpposingSupersaturation",
          "evidence-snapshot",
          `${label}:boundary-sigma`,
        ),
      ]);
      this.resetRelaxationHistory();
      return {
        boundaryAttachmentCoefficient: new Float32Array(coefficientBytes).slice(
          0,
          inputCount,
        ),
        boundarySupersaturation: new Float32Array(boundarySigmaBytes).slice(
          0,
          inputCount,
        ),
      };
    } catch (error) {
      this.poison(error);
      throw error;
    } finally {
      if (resources !== null) this.destroyTemporaryResources(resources);
      this.inFlight = false;
    }
  }

  /**
   * Observe the noise this operator actually applied during the accepted relaxation phase.
   *
   * Boundary publication and the Dirichlet shell clamp overwrite the accepted phase's
   * destination field, so the phase is first reconstructed from the SAME source buffer the
   * accepted sweep consumed through the SAME shader stages. The aggregate boundary solve then
   * runs twice over that one reconstruction — once at the configured noise amplitude and once
   * with the amplitude forced to zero — and both coefficient fields are read back. A zero noise
   * bit feeds identical inputs to identical arithmetic, so the two fields differ at exactly the
   * cells where this operator applied noise.
   *
   * This overwrites the shared scratch buffers, including the previous-phase boundary cache, so
   * the accepted evidence snapshot must be taken first; the cache is marked unavailable
   * afterwards rather than left silently stale.
   */
  async readAppliedNoise(
    label = "lk-applied-noise",
  ): Promise<GpuLkAppliedNoiseObservation> {
    this.assertUsable();
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK applied-noise label is required");
    }
    if (this.inFlight || this.cycleState !== "ready") {
      throw new Error(
        `GPU LK applied-noise observation requires an accepted relaxation (state=${this.cycleState})`,
      );
    }
    this.inFlight = true;
    let resources: TemporaryGpuResources | null = null;
    let acceptedReportBytes: ArrayBuffer | null = null;
    try {
      acceptedReportBytes = await readGpuBuffer(
        this.device,
        this.report,
        {
          purpose: "compact-metric",
          label: `${label}:accepted-report-snapshot`,
          generation: this.generation,
          byteOffset: 0,
          byteLength: GPU_LK_REPORT_BYTES,
        },
        this.audit,
      );
      resources = this.createTemporaryResources();
      this.device.queue.writeBuffer(
        this.report,
        GPU_LK_REPORT_WORD.converged * Uint32Array.BYTES_PER_ELEMENT,
        new Uint32Array([0]),
      );
      this.device.queue.writeBuffer(
        this.report,
        GPU_LK_REPORT_WORD.convergenceMode * Uint32Array.BYTES_PER_ELEMENT,
        new Uint32Array([0]),
      );
      const sourceName = this.activeOwner === 0 ? "lkSigmaB" : "lkSigmaA";
      const configuredControls = this.controls();
      const zeroNoiseControls = this.controls({ noiseEpsilon: 0 });
      const configuredEncoder = this.device.createCommandEncoder({
        label: `vcc:${label}:configured-noise`,
      });
      const configuredPass = configuredEncoder.beginComputePass({
        label: `vcc:${label}:configured-noise:stages`,
      });
      this.encodeReconstructedPhase(
        configuredPass,
        sourceName,
        configuredControls,
        resources,
        `${label}:phase`,
      );
      this.encodeReconstructedBoundarySolve(
        configuredPass,
        configuredControls,
        resources,
        `${label}:configured-noise`,
      );
      configuredPass.end();
      await this.submissions.submit(
        `${label}:configured-noise`,
        this.generation,
        [configuredEncoder.finish()],
      );
      const configuredReport = await this.readCompactReport(
        `${label}:configured-noise:report`,
      );
      if (configuredReport.errorFlags !== 0) {
        throw new Error(
          "GPU LK applied-noise phase reconstruction failed: " +
            explainErrorFlags(configuredReport.errorFlags),
        );
      }
      const configuredBytes = await this.readArenaBuffer(
        "scratchScalarA",
        "evidence-snapshot",
        `${label}:configured-noise-coefficient`,
      );
      const zeroNoiseEncoder = this.device.createCommandEncoder({
        label: `vcc:${label}:zero-noise`,
      });
      const zeroNoisePass = zeroNoiseEncoder.beginComputePass({
        label: `vcc:${label}:zero-noise:stages`,
      });
      this.encodeReconstructedBoundarySolve(
        zeroNoisePass,
        zeroNoiseControls,
        resources,
        `${label}:zero-noise`,
      );
      zeroNoisePass.end();
      await this.submissions.submit(
        `${label}:zero-noise`,
        this.generation,
        [zeroNoiseEncoder.finish()],
      );
      const zeroNoiseReport = await this.readCompactReport(
        `${label}:zero-noise:report`,
      );
      if (zeroNoiseReport.errorFlags !== 0) {
        throw new Error(
          "GPU LK zero-noise boundary solve failed: " +
            explainErrorFlags(zeroNoiseReport.errorFlags),
        );
      }
      const [zeroNoiseBytes, boundaryBytes] = await Promise.all([
        this.readArenaBuffer(
          "scratchScalarA",
          "evidence-snapshot",
          `${label}:zero-noise-coefficient`,
        ),
        this.readArenaBuffer(
          "boundaryIndices",
          "evidence-snapshot",
          `${label}:boundary-indices`,
        ),
      ]);
      const noisyBoundaryAttachmentCoefficient = new Float32Array(
        configuredBytes,
      );
      const noiseFreeBoundaryAttachmentCoefficient = new Float32Array(
        zeroNoiseBytes,
      );
      const boundaryIndices = new Uint32Array(boundaryBytes).slice(
        0,
        this.boundaryCountInternal,
      );
      return {
        tick: this.tickInternal,
        rngSeed: this.rngSeed,
        noiseEpsilon: this.noiseEpsilon,
        boundaryIndices,
        noisyBoundaryAttachmentCoefficient,
        noiseFreeBoundaryAttachmentCoefficient,
        appliedNoiseIndices: deriveGpuLkAppliedNoiseIndices(
          boundaryIndices,
          noisyBoundaryAttachmentCoefficient,
          noiseFreeBoundaryAttachmentCoefficient,
        ),
      };
    } catch (error) {
      this.poison(error);
      throw error;
    } finally {
      if (acceptedReportBytes !== null && !this.destroyed) {
        this.device.queue.writeBuffer(this.report, 0, acceptedReportBytes);
      }
      if (resources !== null) this.destroyTemporaryResources(resources);
      this.previousBoundaryCacheAvailableInternal = false;
      this.inFlight = false;
    }
  }

  activeSigmaBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get(this.activeSigmaName());
  }

  fillBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("lkFill");
  }

  occupancyBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("occupancy");
  }

  wallBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("wall");
  }

  topologyBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("topology");
  }

  boundaryIndicesBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("boundaryIndices");
  }

  renderFlagsBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("renderFlags");
  }

  reportBuffer(): GPUBuffer {
    this.assertUsable();
    return this.report;
  }

  private async readArenaBuffer(
    name: string,
    purpose: GpuReadbackPurpose,
    label: string,
  ): Promise<ArrayBuffer> {
    const buffer = this.arena.get(name);
    return readGpuBuffer(
      this.device,
      buffer,
      {
        purpose,
        label,
        generation: this.generation,
        byteOffset: 0,
        byteLength: this.arena.byteLength(name),
      },
      this.audit,
    );
  }

  async readEvidenceState(
    purpose: "evidence-snapshot" | "checkpoint",
    label = "lk-evidence-state",
  ): Promise<GpuLkEvidenceState> {
    this.assertUsable();
    if (this.inFlight) {
      throw new Error("cannot read GPU LK evidence while work is in flight");
    }
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK evidence label is required");
    }
    this.inFlight = true;
    const activeName = this.activeSigmaName();
    const previousName = this.activeOwner === 0 ? "lkSigmaB" : "lkSigmaA";
    const boundaryCount = this.boundaryCountInternal;
    const attachmentCount = this.lastAttachedNowInternal;
    try {
      const [
        sigmaBytes,
        previousSigmaBytes,
        cycleReferenceBytes,
        fillBytes,
        occupancyBytes,
        wallBytes,
        topologyBytes,
        boundaryBytes,
        coefficientBytes,
        boundarySigmaBytes,
        opposingBytes,
        renderBytes,
        previousBoundarySigmaBytes,
      ] = await Promise.all([
        this.readArenaBuffer(activeName, purpose, `${label}:sigma`),
        this.readArenaBuffer(
          previousName,
          purpose,
          `${label}:previous-sigma`,
        ),
        this.readArenaBuffer(
          "lkCycleReference",
          purpose,
          `${label}:cycle-reference`,
        ),
        this.readArenaBuffer("lkFill", purpose, `${label}:fill`),
        this.readArenaBuffer("occupancy", purpose, `${label}:occupancy`),
        this.readArenaBuffer("wall", purpose, `${label}:wall`),
        this.readArenaBuffer("topology", purpose, `${label}:topology`),
        this.readArenaBuffer(
          "boundaryIndices",
          purpose,
          `${label}:boundary-and-attachment-indices`,
        ),
        this.readArenaBuffer(
          "lkBoundaryAttachmentCoefficient",
          purpose,
          `${label}:boundary-coefficient`,
        ),
        this.readArenaBuffer(
          "lkBoundarySupersaturation",
          purpose,
          `${label}:boundary-sigma`,
        ),
        this.readArenaBuffer(
          "lkOpposingSupersaturation",
          purpose,
          `${label}:opposing-sigma`,
        ),
        this.readArenaBuffer("renderFlags", purpose, `${label}:render-flags`),
        this.previousBoundaryCacheAvailableInternal
          ? this.readArenaBuffer(
              "scratchScalarB",
              purpose,
              `${label}:previous-boundary-sigma`,
            )
          : Promise.resolve(null),
      ]);
      const packedIndices = new Uint32Array(boundaryBytes);
      return {
        sigma: new Float32Array(sigmaBytes),
        previousSigma: new Float32Array(previousSigmaBytes),
        cycleReference: new Float32Array(cycleReferenceBytes),
        fill: new Float32Array(fillBytes),
        occupancy: new Uint32Array(occupancyBytes),
        wall: new Uint32Array(wallBytes),
        topology: new Uint32Array(topologyBytes),
        boundaryIndices: packedIndices.slice(0, boundaryCount),
        boundaryAttachmentCoefficient: new Float32Array(coefficientBytes),
        boundarySupersaturation: new Float32Array(boundarySigmaBytes),
        previousBoundarySupersaturation:
          previousBoundarySigmaBytes === null
            ? null
            : new Float32Array(previousBoundarySigmaBytes),
        opposingSupersaturation: new Float32Array(opposingBytes),
        renderFlags: new Uint32Array(renderBytes),
        attachmentIndices: packedIndices.slice(
          this.layout.cellCount - attachmentCount,
        ),
      };
    } finally {
      this.inFlight = false;
    }
  }

  async exportConversionSnapshot(
    label = "lk-conversion-snapshot",
  ): Promise<GpuLkConversionSnapshot> {
    this.assertUsable();
    if (this.inFlight) {
      throw new Error("cannot export GPU LK conversion while work is in flight");
    }
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU LK conversion label is required");
    }
    this.inFlight = true;
    const activeName = this.activeSigmaName();
    try {
      const [sigmaBytes, fillBytes, occupancyBytes] = await Promise.all([
        this.readArenaBuffer(
          activeName,
          "checkpoint",
          `${label}:sigma`,
        ),
        this.readArenaBuffer("lkFill", "checkpoint", `${label}:fill`),
        this.readArenaBuffer(
          "occupancy",
          "checkpoint",
          `${label}:occupancy`,
        ),
      ]);
      const metadata: GpuLkConversionMetadata = {
        dims: { ...this.layout.dims },
        tick: this.tickInternal,
        simTimeSeconds: this.simTimeSecondsInternal,
        rngSeed: this.rngSeed,
        noiseEpsilon: this.noiseEpsilon,
        domain: this.domain,
        center: [...this.center] as [number, number, number],
        tempC: this.tempCInternal,
        sigmaInfinity: this.sigmaInfinityInternal,
        dxUm: this.dxUm,
        pressurePa: this.pressurePa,
        paramSet: this.paramSet,
        cflFill: this.cflFill,
        relaxTol: this.relaxTol,
        divTol: this.divTol,
        relaxMaxSweeps: this.relaxMaxSweeps,
        surfacePolicy: AGGREGATE_V5,
        farField: this.farField,
      };
      return {
        metadata,
        occupancy: new Uint32Array(occupancyBytes),
        fill: new Float32Array(fillBytes),
        sigma: new Float32Array(sigmaBytes),
      };
    } finally {
      this.inFlight = false;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    if (this.inFlight) {
      throw new Error("cannot destroy GPU LK solver while work is in flight");
    }
    this.destroyed = true;
    this.releaseOwnedResources(false);
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  private assertUsable(): void {
    if (this.poisonedReason !== null) {
      throw new Error(`GPU LK solver is poisoned: ${this.poisonedReason}`);
    }
    if (this.destroyed) throw new Error("GPU LK solver is destroyed");
    if (this.arena.isDestroyed()) throw new Error("GPU LK arena is destroyed");
    if (this.submissions.currentGeneration() !== this.generation) {
      throw new Error("GPU LK solver generation is stale");
    }
  }

  private poison(error: unknown): void {
    if (this.poisonedReason === null) {
      this.poisonedReason =
        error instanceof Error ? error.message : "unknown GPU LK failure";
    }
    this.destroyed = true;
    this.releaseOwnedResources(true);
  }

  private releaseOwnedResources(destroyArena: boolean): void {
    if (!this.ownedResourcesReleased) {
      this.ownedResourcesReleased = true;
      this.report.destroy();
      claimedLkArenas.delete(this.arena);
    }
    if (destroyArena) this.arena.destroy();
  }
}
