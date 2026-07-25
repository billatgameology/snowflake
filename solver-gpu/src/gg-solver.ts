import {
  ggParamsFromTimelineEnvironment,
  ggTimelineEnvironmentFromParams,
  validateParams,
  validateTimelineSchedule,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGParams,
  type GGTimelineEnvironment,
} from "@vcc/core";
import {
  GPU_TOPOLOGY_BOUNDARY,
  GPU_TOPOLOGY_FAR_FIELD,
  GpuGgDiffusion,
  snapshotGpuGgDiffusionInput,
} from "./diffusion.ts";
import { GpuGgSurface } from "./gg-surface.ts";
import { createGpuGridLayout } from "./layout.ts";
import { GpuBufferArena } from "./resources.ts";
import { GpuSubmissionController } from "./submission.ts";

const UINT32_MAX = 0xffff_ffff;

export interface GpuGgSolverInput {
  readonly initialVapor: Float32Array;
  readonly initialBoundaryMass: Float32Array;
  readonly occupancy: Uint32Array;
  readonly wall: Uint32Array;
  readonly topology: Uint32Array;
  readonly initialBoundaryIndices: Uint32Array;
  readonly params: GGParams;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly tick: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
}

export interface GpuGgEnvironmentTransitionReport {
  readonly operator: "GGThreshold";
  readonly boundary: {
    readonly phase: "completedCycleBoundary";
    readonly completedCycles: number;
    readonly tick: number;
  };
  readonly beforeEnvironment: GGTimelineEnvironment;
  readonly afterEnvironment: GGTimelineEnvironment;
}

export type GpuGgCycleState =
  | "boundary"
  | "advancing"
  | "transitioning"
  | "incomplete";

/**
 * This operator's own statement of the ledger rule it implements, in the shared
 * `SurfaceOperator` ledger vocabulary (solver-cpu/src/operator.ts `LedgerReport`). GGThreshold
 * claims Sigma(b+d) unconditionally and meters the Dirichlet shell only when THIS operator's
 * own far field is the replenished one; every remaining term belongs to LibbrechtKinetics and
 * is never populated here. The prose claim is deliberately absent: the applicable-term
 * partition is what a lane can state about itself without restating the oracle's wording.
 */
export interface GpuGgLedgerRule {
  readonly rule: "GGThreshold";
  readonly totalMassBDApplicable: boolean;
  readonly dirichletMeterApplicable: boolean;
  readonly fillLedgerIceCellsApplicable: boolean;
  readonly fillLedgerVaporUnitsApplicable: boolean;
  readonly holeFillDeficitApplicable: boolean;
  readonly saturationClippedFillApplicable: boolean;
  readonly lastDivergenceResidualApplicable: boolean;
}

/**
 * This operator's own classification of its field relaxation, in the shared `RelaxationReport`
 * vocabulary: which diagnostics its rule and its own far-field condition define.
 */
export interface GpuGgRelaxationClassification {
  readonly converged: boolean;
  readonly residualApplicable: boolean;
  readonly divergenceApplicable: boolean;
  readonly shellClampApplicable: boolean;
  readonly surfaceExchangeApplicable: boolean;
  readonly smootherDriftApplicable: boolean;
  readonly minLocalSurfaceExchangeApplicable: boolean;
}

/** This operator's own classification of its surface step. */
export interface GpuGgSurfaceStepClassification {
  readonly deltaTimeSeconds: number | null;
  readonly maxKineticFillIncrement: number | null;
  readonly stalled: boolean;
  readonly skippedUnconverged: boolean;
}

/** The grid this operator actually allocated, plus the domain it was configured for. */
export interface GpuGgDomainExtents {
  readonly dims: Dims;
  readonly plane: number;
  readonly cellCount: number;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
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
  return owned;
}

function snapshotTimelineVector(value: unknown, label: string): readonly number[] {
  if (!Array.isArray(value) || value.length !== 7) {
    throw new Error(`${label} must contain exactly seven values`);
  }
  const copy = new Array<number>(7);
  for (let index = 0; index < 7; index++) copy[index] = value[index] as number;
  return copy;
}

function snapshotTimelineEnvironment(value: GGTimelineEnvironment): GGTimelineEnvironment {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("G-G timeline environment must be an object");
  }
  const record = value as unknown as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = ["ggThreshBeta", "kappa", "mu", "phi", "rho"];
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`G-G timeline environment keys must be exactly [${expected.join(", ")}]`);
  }
  const rho = record.rho;
  const phi = record.phi;
  const kappa = record.kappa;
  const mu = record.mu;
  const ggThreshBeta = record.ggThreshBeta;
  return {
    rho: rho as number,
    phi: phi as number,
    kappa: snapshotTimelineVector(
      kappa,
      "G-G timeline environment.kappa",
    ) as GGTimelineEnvironment["kappa"],
    mu: snapshotTimelineVector(
      mu,
      "G-G timeline environment.mu",
    ) as GGTimelineEnvironment["mu"],
    ggThreshBeta: snapshotTimelineVector(
      ggThreshBeta,
      "G-G timeline environment.ggThreshBeta",
    ) as GGTimelineEnvironment["ggThreshBeta"],
  };
}

function requireU32(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new Error(`${label} must be a u32-safe integer`);
  }
  return value;
}

function hasAttachedNeighbor(
  occupancy: Uint32Array,
  nx: number,
  ny: number,
  nz: number,
  index: number,
): boolean {
  const plane = nx * ny;
  const k = Math.floor(index / plane);
  const remainder = index - k * plane;
  const j = Math.floor(remainder / nx);
  const i = remainder - j * nx;
  return (
    (i + 1 < nx && occupancy[index + 1] !== 0) ||
    (i > 0 && occupancy[index - 1] !== 0) ||
    (j + 1 < ny && occupancy[index + nx] !== 0) ||
    (j > 0 && occupancy[index - nx] !== 0) ||
    (i + 1 < nx && j > 0 && occupancy[index + 1 - nx] !== 0) ||
    (i > 0 && j + 1 < ny && occupancy[index - 1 + nx] !== 0) ||
    (k + 1 < nz && occupancy[index + plane] !== 0) ||
    (k > 0 && occupancy[index - plane] !== 0)
  );
}

function validateBoundaryOrder(
  occupancy: Uint32Array,
  wall: Uint32Array,
  boundaryIndices: Uint32Array,
  nx: number,
  ny: number,
  nz: number,
): void {
  const cellCount = occupancy.length;
  const membership = new Uint8Array(cellCount);
  for (let position = 0; position < boundaryIndices.length; position++) {
    const index = boundaryIndices[position];
    if (index >= cellCount) {
      throw new Error(`initial boundary index is out of range at ${position}`);
    }
    if (membership[index] !== 0) {
      throw new Error(`initial boundary index is duplicated: ${index}`);
    }
    if (occupancy[index] !== 0 || wall[index] !== 0) {
      throw new Error(`initial boundary index is blocked: ${index}`);
    }
    if (!hasAttachedNeighbor(occupancy, nx, ny, nz, index)) {
      throw new Error(`initial boundary index has no attached neighbor: ${index}`);
    }
    membership[index] = 1;
  }
  for (let index = 0; index < cellCount; index++) {
    const expected =
      occupancy[index] === 0 &&
      wall[index] === 0 &&
      hasAttachedNeighbor(occupancy, nx, ny, nz, index);
    if (expected !== (membership[index] !== 0)) {
      throw new Error(`initial boundary membership is incomplete at ${index}`);
    }
  }
}

export class GpuGgSolver {
  private destroyed = false;
  private inFlight = false;
  private poisonedReason: string | null = null;
  private cycleState: GpuGgCycleState = "boundary";
  private tickInternal: number;
  private paramsInternal: GGParams;
  private readonly device: GPUDevice;
  private readonly submissions: GpuSubmissionController;
  private readonly arena: GpuBufferArena;
  private readonly diffusion: GpuGgDiffusion;
  private readonly surface: GpuGgSurface;
  readonly generation: number;
  readonly farField: FarFieldCondition;
  readonly domain: DomainShape;
  readonly center: readonly [number, number, number];
  readonly rngSeed: number;
  readonly noiseEpsilon: number;

  private constructor(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    diffusion: GpuGgDiffusion,
    surface: GpuGgSurface,
    input: {
      readonly params: GGParams;
      readonly tick: number;
      readonly farField: FarFieldCondition;
      readonly domain: DomainShape;
      readonly center: readonly [number, number, number];
      readonly rngSeed: number;
      readonly noiseEpsilon: number;
    },
  ) {
    this.device = device;
    this.submissions = submissions;
    this.arena = arena;
    this.diffusion = diffusion;
    this.surface = surface;
    this.paramsInternal = input.params;
    this.tickInternal = input.tick;
    this.farField = input.farField;
    this.domain = input.domain;
    this.center = input.center;
    this.rngSeed = input.rngSeed;
    this.noiseEpsilon = input.noiseEpsilon;
    this.generation = arena.generation;
  }

  static async create(
    device: GPUDevice,
    submissions: GpuSubmissionController,
    arena: GpuBufferArena,
    input: GpuGgSolverInput,
  ): Promise<GpuGgSolver> {
    if (input === null || typeof input !== "object") {
      throw new Error("GPU G-G solver input must be an object");
    }
    const record = input as unknown as Record<string, unknown>;
    const initialVaporValue = record.initialVapor;
    const initialBoundaryMassValue = record.initialBoundaryMass;
    const occupancyValue = record.occupancy;
    const wallValue = record.wall;
    const topologyValue = record.topology;
    const boundaryValue = record.initialBoundaryIndices;
    if (!(initialVaporValue instanceof Float32Array)) {
      throw new Error("initialVapor must be a Float32Array");
    }
    if (!(initialBoundaryMassValue instanceof Float32Array)) {
      throw new Error("initialBoundaryMass must be a Float32Array");
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
    if (!(boundaryValue instanceof Uint32Array)) {
      throw new Error("initialBoundaryIndices must be a Uint32Array");
    }
    const initialVapor = copyFloat32(initialVaporValue, "initialVapor");
    const initialBoundaryMass = copyFloat32(
      initialBoundaryMassValue,
      "initialBoundaryMass",
    );
    const occupancy = copyUint32(occupancyValue, "occupancy");
    const wall = copyUint32(wallValue, "wall");
    const topology = copyUint32(topologyValue, "topology");
    const initialBoundaryIndices = copyUint32(
      boundaryValue,
      "initialBoundaryIndices",
    );
    const params = snapshotParams(record.params as GGParams);
    const rngSeed = record.rngSeed as number;
    const noiseEpsilon = record.noiseEpsilon as number;
    const tick = record.tick as number;
    const farField = record.farField as FarFieldCondition;
    const domain = record.domain as DomainShape;
    const centerValue = record.center;
    if (!Array.isArray(centerValue) || centerValue.length !== 3) {
      throw new Error("center must contain exactly three coordinates");
    }
    const center = [
      centerValue[0] as number,
      centerValue[1] as number,
      centerValue[2] as number,
    ] as const;
    requireU32(tick, "tick");
    requireU32(rngSeed, "rngSeed");
    if (!Number.isFinite(noiseEpsilon) || noiseEpsilon < 0 || noiseEpsilon > 1) {
      throw new Error("noiseEpsilon must be finite and in [0,1]");
    }
    if (farField !== "reflecting" && farField !== "dirichlet") {
      throw new Error("farField must be reflecting or dirichlet");
    }
    if (domain !== "box" && domain !== "hexPrism") {
      throw new Error("domain must be box or hexPrism");
    }
    const layout = createGpuGridLayout(arena.plan.layout.dims);
    for (let axis = 0; axis < 3; axis++) {
      const bound =
        axis === 0
          ? layout.dims.nx
          : axis === 1
            ? layout.dims.ny
            : layout.dims.nz;
      if (
        !Number.isSafeInteger(center[axis]) ||
        center[axis] < 0 ||
        center[axis] >= bound
      ) {
        throw new Error(`center[${axis}] must be an in-domain integer`);
      }
    }
    if (
      occupancy.length !== layout.cellCount ||
      wall.length !== layout.cellCount ||
      topology.length !== layout.cellCount ||
      initialVapor.length !== layout.cellCount ||
      initialBoundaryMass.length !== layout.cellCount
    ) {
      throw new Error("GPU G-G state lengths must match the arena grid");
    }
    validateBoundaryOrder(
      occupancy,
      wall,
      initialBoundaryIndices,
      layout.dims.nx,
      layout.dims.ny,
      layout.dims.nz,
    );
    let attachedCount = 0;
    const combinedTopology = new Uint32Array(topology);
    for (let index = 0; index < layout.cellCount; index++) {
      if ((combinedTopology[index] & ~GPU_TOPOLOGY_FAR_FIELD) !== 0) {
        throw new Error(`input topology contains reserved bits at ${index}`);
      }
      if (!Number.isFinite(initialBoundaryMass[index]) || initialBoundaryMass[index] < 0) {
        throw new Error(`initialBoundaryMass must be finite and nonnegative at ${index}`);
      }
      if (wall[index] !== 0 && initialBoundaryMass[index] !== 0) {
        throw new Error(`wall boundary mass must be zero at ${index}`);
      }
      if (occupancy[index] !== 0) attachedCount++;
    }
    for (const index of initialBoundaryIndices) {
      combinedTopology[index] |= GPU_TOPOLOGY_BOUNDARY;
    }
    const diffusionSnapshot = snapshotGpuGgDiffusionInput(layout, {
      initialVapor,
      occupancy,
      wall,
      topology: combinedTopology,
      phi: params.phi,
      rho: params.rho,
      noiseEpsilon,
      rngSeed,
      tick,
      farField,
    });
    const diffusion = await GpuGgDiffusion.create(
      device,
      submissions,
      arena,
      diffusionSnapshot,
    );
    let surface: GpuGgSurface | null = null;
    try {
      surface = await GpuGgSurface.create(device, submissions, arena, {
        initialBoundaryMass,
        initialBoundaryIndices,
        attachedCount,
        params,
        tick,
        farField,
      });
      return new GpuGgSolver(
        device,
        submissions,
        arena,
        diffusion,
        surface,
        {
          params,
          tick,
          farField,
          domain,
          center,
          rngSeed,
          noiseEpsilon,
        },
      );
    } catch (error) {
      surface?.destroy();
      diffusion.destroy();
      arena.destroy();
      throw error;
    }
  }

  tick(): number {
    this.assertUsable();
    return this.tickInternal;
  }

  params(): GGParams {
    this.assertUsable();
    return snapshotParams(this.paramsInternal);
  }

  timelineEnvironment(): GGTimelineEnvironment {
    this.assertUsable();
    return ggTimelineEnvironmentFromParams(this.paramsInternal);
  }

  /**
   * This operator's own cycle phase. Only "boundary" accepts a step or an environment event;
   * the value is the same explicit state machine `step()` and `applyTimelineEnvironment()`
   * enforce, never a restatement of the oracle's phase.
   */
  cyclePhase(): GpuGgCycleState {
    this.assertUsable();
    return this.cycleState;
  }

  /**
   * Total masked-average diffusion passes this operator has actually executed, counted by the
   * diffusion stage as it submits them. Not derived from the tick and not supplied by a caller.
   */
  completedDiffusionPasses(): number {
    this.assertUsable();
    return this.diffusion.completedPasses();
  }

  /** The grid this operator allocated and the domain/center it holds. */
  domainExtents(): GpuGgDomainExtents {
    this.assertUsable();
    const layout = createGpuGridLayout(this.arena.plan.layout.dims);
    return {
      dims: { nx: layout.dims.nx, ny: layout.dims.ny, nz: layout.dims.nz },
      plane: layout.plane,
      cellCount: layout.cellCount,
      domain: this.domain,
      center: [this.center[0], this.center[1], this.center[2]],
    };
  }

  /** The ledger rule this operator implements, under this operator's own far field. */
  ledgerRule(): GpuGgLedgerRule {
    this.assertUsable();
    return {
      rule: "GGThreshold",
      totalMassBDApplicable: true,
      dirichletMeterApplicable: this.farField === "dirichlet",
      fillLedgerIceCellsApplicable: false,
      fillLedgerVaporUnitsApplicable: false,
      holeFillDeficitApplicable: false,
      saturationClippedFillApplicable: false,
      lastDivergenceResidualApplicable: false,
    };
  }

  /**
   * How this operator's relaxation classifies itself: the published single masked-average pass
   * IS the G-G dynamics rather than a solve, so it converges vacuously and defines no residual,
   * no divergence identity, no surface exchange, no smoother drift, and no local exchange
   * minimum. The shell clamp is a diagnostic only under this operator's own Dirichlet far
   * field, where its surface stage reduces and accumulates the clamp delta.
   */
  relaxationClassification(): GpuGgRelaxationClassification {
    this.assertUsable();
    return {
      converged: true,
      residualApplicable: false,
      divergenceApplicable: false,
      shellClampApplicable: this.farField === "dirichlet",
      surfaceExchangeApplicable: false,
      smootherDriftApplicable: false,
      minLocalSurfaceExchangeApplicable: false,
    };
  }

  /**
   * How this operator's surface step reports itself. Its cycle report carries counters only —
   * the ABI has no physical-time and no kinetic-fill term — and its WGSL has no stall and no
   * unconverged-skip path, so a G-G cycle is discrete by construction.
   */
  surfaceStepClassification(): GpuGgSurfaceStepClassification {
    this.assertUsable();
    return {
      deltaTimeSeconds: null,
      maxKineticFillIncrement: null,
      stalled: false,
      skippedUnconverged: false,
    };
  }

  applyTimelineEnvironment(
    environment: GGTimelineEnvironment,
  ): GpuGgEnvironmentTransitionReport {
    this.assertUsable();
    if (this.cycleState !== "boundary" || this.inFlight) {
      throw new Error(
        `GPU G-G timeline environment requires a completed-cycle boundary ` +
          `(state=${this.cycleState})`,
      );
    }
    const target = snapshotTimelineEnvironment(environment);
    const beforeEnvironment = this.timelineEnvironment();
    validateTimelineSchedule({
      version: 1,
      mode: "abrupt",
      operator: "GGThreshold",
      initialEnvironment: beforeEnvironment,
      events: [
        {
          index: 0,
          operator: "GGThreshold",
          trigger: { kind: "tick", value: 0 },
          environment: target,
        },
      ],
    });
    const params = snapshotParams(ggParamsFromTimelineEnvironment(target));
    const afterEnvironment = ggTimelineEnvironmentFromParams(params);
    this.cycleState = "transitioning";
    try {
      this.diffusion.updateControls({
        tick: this.tickInternal,
        rho: params.rho,
        phi: params.phi,
      });
      this.surface.updateControls({ params, tick: this.tickInternal });
      this.paramsInternal = params;
      this.cycleState = "boundary";
      return {
        operator: "GGThreshold",
        boundary: {
          phase: "completedCycleBoundary",
          completedCycles: this.tickInternal,
          tick: this.tickInternal,
        },
        beforeEnvironment,
        afterEnvironment,
      };
    } catch (error) {
      this.poison(error);
      throw error;
    }
  }

  async step(label = "gg-cycle"): Promise<void> {
    this.assertUsable();
    if (this.cycleState !== "boundary" || this.inFlight) {
      throw new Error(
        `GPU G-G step requires a completed-cycle boundary (state=${this.cycleState})`,
      );
    }
    this.inFlight = true;
    this.cycleState = "advancing";
    try {
      this.diffusion.updateControls({
        tick: this.tickInternal,
        rho: this.paramsInternal.rho,
        phi: this.paramsInternal.phi,
      });
      this.surface.updateControls({
        params: this.paramsInternal,
        tick: this.tickInternal,
      });
      await this.diffusion.runPasses(1, `${label}:diffusion`);
      await this.surface.advance(
        this.diffusion.activeVaporName(),
        `${label}:surface`,
      );
      this.tickInternal++;
      this.cycleState = "boundary";
    } catch (error) {
      this.cycleState = "incomplete";
      this.poison(error);
      throw error;
    } finally {
      this.inFlight = false;
    }
  }

  activeVaporName(): "ggVaporA" | "ggVaporB" {
    this.assertUsable();
    return this.diffusion.activeVaporName();
  }

  activeVaporBuffer(): GPUBuffer {
    this.assertUsable();
    return this.diffusion.activeVaporBuffer();
  }

  occupancyBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("occupancy");
  }

  wallBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("wall");
  }

  noiseBuffer(): GPUBuffer {
    this.assertUsable();
    return this.arena.get("noise");
  }

  reportBuffer(): GPUBuffer {
    this.assertUsable();
    return this.surface.reportBuffer();
  }

  boundaryIndicesBuffer(): GPUBuffer {
    this.assertUsable();
    return this.surface.boundaryIndicesBuffer();
  }

  attachmentIndicesBuffer(): GPUBuffer {
    this.assertUsable();
    return this.surface.attachmentIndicesBuffer();
  }

  renderFlagsBuffer(): GPUBuffer {
    this.assertUsable();
    return this.surface.renderFlagsBuffer();
  }

  topologyBuffer(): GPUBuffer {
    this.assertUsable();
    return this.surface.topologyBuffer();
  }

  boundaryMassBuffer(): GPUBuffer {
    this.assertUsable();
    return this.surface.boundaryMassBuffer();
  }

  destroy(): void {
    if (this.destroyed) return;
    if (this.inFlight) {
      throw new Error("cannot destroy GPU G-G solver while work is in flight");
    }
    this.destroyed = true;
    this.surface.destroy();
    this.diffusion.destroy();
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  private assertUsable(): void {
    if (this.poisonedReason !== null) {
      throw new Error(`GPU G-G solver is poisoned: ${this.poisonedReason}`);
    }
    if (this.destroyed) throw new Error("GPU G-G solver is destroyed");
    if (this.arena.isDestroyed()) throw new Error("GPU G-G solver arena is destroyed");
    if (this.submissions.currentGeneration() !== this.generation) {
      throw new Error("GPU G-G solver generation is stale");
    }
  }

  private poison(error: unknown): void {
    if (this.poisonedReason === null) {
      this.poisonedReason =
        error instanceof Error ? error.message : "unknown GPU G-G cycle failure";
    }
    this.destroyed = true;
    try {
      this.surface.destroy();
    } catch {
      // The arena destruction below is the fail-closed fallback.
    }
    try {
      this.diffusion.destroy();
    } catch {
      // The arena destruction below is the fail-closed fallback.
    }
    this.arena.destroy();
  }
}
