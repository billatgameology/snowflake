// LibbrechtKinetics — the surface operator of attachment-kinetics §4.4, implemented.
//
// One growth step (§4.4, decision 0009): the named surfacePolicy selects the immutable
// legacy-v3 per-contact operator or a forward aggregate-hv-g1h1-v4/v5/v6 boundary-pixel operator.
// Aggregate v4/v5 apply the Phase 2a reflecting smoother, replace each boundary pixel by the
// nonlinear Eq. 5.34 value solved from opposing vapor pixels, and clamp the Dirichlet shell. Fixed-sigma
// physics runs require BOTH the iterate residual and the signed global exchange divergence
// identity. V5 directly meters float64 reflecting-smoother drift in that identity (ADR 0013)
// without changing any field value. The cached self-consistent (alphaHK, sigma_b) pair then fills
// once per boundary pixel with H_b=1; the adaptive fill-CFL and explicit saturation-clipping
// ledger are unchanged.
//
// Dispositions (§4.4 component 5): no kappa freezing (the selected boundary condition is the
// only exchange path), no melting, hole-filling kept, noise is a per-cell multiplicative
// alphaHK slowdown applied identically in the boundary condition and growth, drift unsupported.
//
// Conservation claims (§4.4 components 3-4): the field is a quasi-static POTENTIAL, not a
// mass store — the meaningful checks are (a) for fixed-sigma Dirichlet, the discrete divergence
// identity REQUIRED for convergence (per-sweep injection equals signed net numerical boundary
// exchange, since the interior smoother conserves), and (b) exact bookkeeping: fillLedger plus
// recorded UNAPPLIED saturation excess equals the selected policy's Hertz-Knudsen demand
// (hole-filled cells' unearned remainder is reported as holeFillDeficit, never hidden).
// Environment-neutral: no Node APIs
// (charter §3.1).

import {
  alphaHK,
  cSat,
  cellCount,
  classifyFacet,
  domainCenter,
  hexDistance,
  hexSeedSites,
  isLKSurfacePolicy,
  kineticLength,
  mIce,
  metersSmootherDrift,
  randomBit,
  usesCanonicalOpposingOrder,
  validateTimelineSchedule,
  vKin,
  DOMAIN_CONTACT_FRACTION,
  STREAM_NOISE_ALPHA_HK,
  type Dims,
  type DomainShape,
  type FacetClass,
  type FarFieldCondition,
  type LKSurfacePolicy,
  type LKTimelineEnvironment,
  type NucleationParamSet,
} from "@vcc/core";
import type { LedgerReport, RelaxationReport, SurfaceOperator, SurfaceReport } from "./operator.ts";

export interface LKSolverOptions {
  /** Coupled classifier/Robin/fill policy. Required: evidence must never rely on a default. */
  readonly surfacePolicy: LKSurfacePolicy;
  readonly dims: Dims;
  /** Temperature, °C. Must keep (Tm − T) inside the digitized domain [1, 50]. */
  readonly tempC: number;
  /** Far-field supersaturation (dimensionless fraction), held at the Dirichlet shell. */
  readonly sigmaInfinity: number;
  /** Lattice spacing, microns (P4 run input). */
  readonly dxUm: number;
  readonly pressurePa?: number; // default 1 atm
  readonly paramSet?: NucleationParamSet; // default "CAK_A1" (see libbrecht.ts)
  /** Fill-CFL bound on the selected policy's max per-cell kinetic fill increment. */
  readonly cflFill?: number; // default 0.1
  /** Relaxation: per-sweep max |change| / sigmaInfinity below this = converged. */
  readonly relaxTol?: number; // default 1e-9
  /**
   * Divergence-identity tolerance — ALSO required for convergence (round-3 maker review:
   * iterate-change alone reported "converged" fields whose shell-vs-sink imbalance grew with
   * domain size past the gate criterion; the spec says a failed identity means not
   * converged, so the loop now enforces both). Ignored in the reflecting diagnostic mode.
   */
  readonly divTol?: number; // default 1e-6
  readonly relaxMaxSweeps?: number; // default 200_000
  readonly rngSeed: number;
  /** alphaHK slowdown amplitude — applied identically in the relaxation boundary condition and
      the interface update for the same tick (round-3 coupling fix; this doc said "v_n
      slowdown" until round 5); 0 (default) = off. P4 dial (§4.4 component 5). */
  readonly noiseEpsilon?: number;
  readonly domain?: DomainShape; // default "hexPrism" (Dirichlet shell needs a defined far field)
  /**
   * "dirichlet" (default — the physical condition for this rule) or "reflecting", the
   * DIAGNOSTIC-ONLY mode §4.4 component 1 promises for machinery tests: no clamp, no source;
   * a quasi-static reflecting solve has only the depleted steady state, so no physics claim
   * may cite a reflecting LK run.
   */
  readonly farField?: FarFieldCondition;
  readonly seedRadius?: number | null;
  readonly seedThickness?: number;
  readonly center?: readonly [number, number, number];
  /**
   * TEST-ONLY hook replacing alphaHK for boundary-law tests. Never set in runs.
   */
  readonly testAlphaOverride?: (facet: FacetClass, tempC: number, sigmaSurf: number) => number;
  /**
   * TEST-ONLY: extra cell indices attached at init (after the hex seed), for constructing
   * exact boundary geometries (e.g. the hole-fill probe). Never set in runs.
   */
  readonly testExtraSeedSites?: readonly number[];
}

/** Read-only liveness report. Observability only; it does not participate in convergence. */
export interface RelaxationProgress {
  readonly sweeps: number;
  readonly residual: number;
  readonly divergenceResidual: number | null;
}

export interface LKEnvironmentDerivedScales {
  readonly cSatPerCubicMeter: number;
  readonly vKinMS: number;
  readonly x0M: number;
  readonly mIceLedger: number;
  /** Conservative six-contact velocity scale retained from the runtime representability guard. */
  readonly maximumKineticVelocityScaleMS: number;
  /** Conservative six-contact fill-rate scale in inverse seconds. */
  readonly maximumKineticFillRateScalePerSecond: number;
}

export interface LKEnvironmentTransitionReport {
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
  readonly derivedBefore: LKEnvironmentDerivedScales;
  readonly derivedAfter: LKEnvironmentDerivedScales;
}

function requirePositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be finite and > 0`);
  }
}

/** Low-overhead deterministic block-Neumaier accumulator for one full-field sweep diagnostic. */
class BlockCompensatedSum {
  private block = 0;
  private blockCount = 0;
  private sum = 0;
  private correction = 0;

  add(value: number): void {
    this.block += value;
    this.blockCount++;
    if (this.blockCount === 256) this.flush();
  }

  value(): number {
    this.flush();
    return this.sum + this.correction;
  }

  private flush(): void {
    if (this.blockCount === 0) return;
    const value = this.block;
    const next = this.sum + value;
    if (Math.abs(this.sum) >= Math.abs(value)) {
      this.correction += this.sum - next + value;
    } else {
      this.correction += value - next + this.sum;
    }
    this.sum = next;
    this.block = 0;
    this.blockCount = 0;
  }
}

/** Decision 0014: conservative operation-count factor for the split stencil + block meter. */
export const FLOAT64_SMOOTHER_DRIFT_BOUND_FACTOR = 1024;

/** Absolute aggregate-v5/v6 roundoff bound for one reflecting-smoother sweep. */
export function float64SmootherDriftAbsLimit(
  activeCellCount: number,
  maxAbsSweepInput: number,
): number {
  if (!Number.isSafeInteger(activeCellCount) || activeCellCount <= 0) {
    throw new Error(`activeCellCount must be a positive safe integer, got ${activeCellCount}`);
  }
  if (!Number.isFinite(maxAbsSweepInput) || maxAbsSweepInput < 0) {
    throw new Error(`maxAbsSweepInput must be finite and nonnegative, got ${maxAbsSweepInput}`);
  }
  if (maxAbsSweepInput === 0) return 0;
  // `EPSILON * maxAbsSweepInput` underflows for an all-subnormal field even though each
  // rounded stencil operation can still move one minimum subnormal. Decision 0014 therefore
  // keeps the same operation-count factor and floors the per-cell scale at one binary64 ULP.
  const perCellRoundoffScale = Math.max(
    Number.EPSILON * maxAbsSweepInput,
    Number.MIN_VALUE,
  );
  const limit =
    FLOAT64_SMOOTHER_DRIFT_BOUND_FACTOR * activeCellCount * perCellRoundoffScale;
  if (!Number.isFinite(limit)) {
    throw new Error(`float64 smoother drift bound overflowed: ${limit}`);
  }
  return limit;
}

function deriveEnvironmentScales(
  tempC: number,
  sigmaInfinity: number,
  pressurePa: number,
  dxM: number,
): LKEnvironmentDerivedScales {
  const cSatPerCubicMeter = cSat(tempC);
  const vKinMS = vKin(tempC);
  const x0M = kineticLength(tempC, pressurePa);
  const mIceLedger = mIce(tempC);
  const maximumKineticVelocityScaleMS = 6 * vKinMS * sigmaInfinity;
  const maximumKineticFillRateScalePerSecond = maximumKineticVelocityScaleMS / dxM;
  for (const [name, value] of [
    ["derived cSat", cSatPerCubicMeter],
    ["derived vKinMS", vKinMS],
    ["derived X_0", x0M],
    ["derived M_ice", mIceLedger],
    ["derived dxM/X_0", dxM / x0M],
    ["derived maximum kinetic velocity scale", maximumKineticVelocityScaleMS],
    ["derived maximum kinetic fill-rate scale", maximumKineticFillRateScalePerSecond],
  ] as const) {
    requirePositiveFinite(value, name);
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

function snapshotTimelineEnvironment(value: unknown): LKTimelineEnvironment {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("LK timeline environment must be an object");
  }
  const record = value as Record<string, unknown>;
  const actual = Object.keys(record).sort();
  const expected = ["sigmaInfinity", "tempC"];
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`LK timeline environment keys must be exactly [${expected.join(", ")}]`);
  }
  // Each caller-controlled accessor is read exactly once. Everything after this point uses
  // only the owned primitive snapshot.
  const tempC = record.tempC;
  const sigmaInfinity = record.sigmaInfinity;
  return { tempC: tempC as number, sigmaInfinity: sigmaInfinity as number };
}

/**
 * The explicit interface-cycle phase. Exported so an evidence probe can pair this operator's
 * own phase against another implementation's, instead of publishing one lane's value twice.
 */
export type LKCycleState =
  | "boundary"
  | "relaxing"
  | "ready"
  | "advancing"
  | "incomplete"
  | "transitioning";

export class LKSolver implements SurfaceOperator {
  readonly surfacePolicy: LKSurfacePolicy;
  readonly dims: Dims;
  private _tempC: number;
  private _sigmaInfinity: number;
  readonly dxM: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly domain: DomainShape;
  readonly farField: FarFieldCondition;
  readonly center: readonly [number, number, number];

  /** Derived physics for this run (libbrecht-parameters.md forms). */
  private _vKinMS: number;
  private _x0M: number;
  private _mIceLedger: number;
  private _maximumKineticVelocityScaleMS: number;
  private _maximumKineticFillRateScalePerSecond: number;
  /** Geometry-adjusted max fill velocity max(rate)·dx (m/s) of the most recent update. */
  lastMaxFillVelocityMS = 0;
  holeFillCountTotal = 0;

  private _tick = 0; // completed growth steps
  simTimeSeconds = 0;

  readonly a: Uint8Array;
  /** Fill fraction — THE separate field of §4.4 component 4. 1 on attached cells. */
  readonly f: Float64Array;
  /** The supersaturation field sigma (d ≡ sigma under this rule; §4.4 component 1). */
  readonly sigma: Float64Array;
  readonly wall: Uint8Array;
  private readonly blocked: Uint8Array;
  private readonly scratch1: Float64Array;
  private readonly scratch2: Float64Array;
  /** V6 opposing-operand buffer: at most the 6 T-neighbors plus the 2 Z-neighbors. */
  private readonly opposingOperands = new Float64Array(8);
  /**
   * ADR 0023's operand-order flag, resolved once. `opposingSigma` runs per boundary cell per
   * sweep — millions of calls in a sustained run — so the policy is not re-tested per call.
   */
  private readonly canonicalOpposingOrder: boolean;
  /** Legacy-v3 Robin absorption factor per boundary cell. */
  private readonly sEff: Float64Array;
  /** Aggregate-v4/v5/v6 boundary pair cached from the last accepted relaxation sweep. */
  private readonly boundaryAlphaHK: Float64Array;
  private readonly boundarySigma: Float64Array;
  private readonly boundarySigmaOpp: Float64Array;

  private boundaryList: number[] = [];
  private readonly inBoundary: Uint8Array;
  private readonly nTAtt: Uint8Array;
  private readonly nZAtt: Uint8Array;
  readonly dirichletCells: Int32Array;
  readonly activeCellCount: number;
  readonly hexRadius: number;
  readonly zHalfExtent: number;

  private iMin = Infinity;
  private iMax = -Infinity;
  private jMin = Infinity;
  private jMax = -Infinity;
  private kMin = Infinity;
  private kMax = -Infinity;
  attachedCount = 0;
  lastAttached: readonly number[] = [];

  private readonly testAlphaOverride?: (
    facet: FacetClass,
    tempC: number,
    sigmaSurf: number,
  ) => number;

  /** Ledger (§4.4 component 4): total fill accumulated through v_n (ice-cell units). */
  fillLedger = 0;
  /** Fill granted by the hole-filling rule without vapor withdrawal — reported, not hidden. */
  holeFillDeficit = 0;
  /** Computed Hertz-Knudsen demand left UNAPPLIED at saturating cells (f hit 1
      mid-increment) — recorded numerical excess, round-3 review blocker 2. Bounded per
      cell/step by the CFL. */
  saturationClippedFill = 0;
  lastRelaxation: RelaxationReport | null = null;
  /** Explicit non-reentrant two-method cycle state. Only boundary accepts an event. */
  private cycleState: LKCycleState = "boundary";
  /** Vapor-unit bookkeeping closed at prior temperature changes. */
  private closedPlacedFillVaporUnits = 0;
  /** Ice-cell ledger value at the start of the current constant-temperature segment. */
  private currentTemperatureSegmentStartFill = 0;

  constructor(options: LKSolverOptions) {
    this.surfacePolicy = options.surfacePolicy;
    this.canonicalOpposingOrder = usesCanonicalOpposingOrder(options.surfacePolicy);
    this.dims = options.dims;
    this._tempC = options.tempC;
    this._sigmaInfinity = options.sigmaInfinity;
    this.dxM = options.dxUm * 1e-6;
    this.pressurePa = options.pressurePa ?? 101325;
    this.paramSet = options.paramSet ?? "CAK_A1";
    this.cflFill = options.cflFill ?? 0.1;
    this.relaxTol = options.relaxTol ?? 1e-9;
    this.relaxMaxSweeps = options.relaxMaxSweeps ?? 200_000;
    this.rngSeed = options.rngSeed;
    this.noiseEpsilon = options.noiseEpsilon ?? 0;
    this.domain = options.domain ?? "hexPrism";
    this.farField = options.farField ?? "dirichlet";
    this.center = options.center ?? domainCenter(this.dims);
    this.testAlphaOverride = options.testAlphaOverride;
    this.divTol = options.divTol ?? 1e-6;

    // Runtime validation is load-bearing: TypeScript does not bind JS callers or parsed CLI
    // numbers, and an invalid run must fail before doing hours of relaxation or writing a
    // checkpoint that the evidence-strict reader correctly rejects.
    if (!isLKSurfacePolicy(this.surfacePolicy)) {
      throw new Error(`surfacePolicy is invalid: ${String(this.surfacePolicy)}`);
    }
    for (const [name, value] of [
      ["dims.nx", this.dims.nx],
      ["dims.ny", this.dims.ny],
      ["dims.nz", this.dims.nz],
    ] as const) {
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive safe integer`);
      }
    }
    const n = cellCount(this.dims);
    if (!Number.isSafeInteger(n) || n <= 0) {
      throw new Error("cell count must be a positive safe integer");
    }
    if (!Number.isFinite(this.tempC) || this.tempC < -50 || this.tempC > -1) {
      throw new Error("tempC must stay in the digitized domain [-50, -1]");
    }
    requirePositiveFinite(this.sigmaInfinity, "sigmaInfinity");
    requirePositiveFinite(options.dxUm, "dxUm");
    requirePositiveFinite(this.pressurePa, "pressurePa");
    if (this.paramSet !== "CAK_A1" && this.paramSet !== "CAK") {
      throw new Error(`paramSet is invalid: ${String(this.paramSet)}`);
    }
    if (!Number.isFinite(this.cflFill) || !(this.cflFill > 0 && this.cflFill < 1)) {
      throw new Error("cflFill must be finite and in (0, 1)");
    }
    requirePositiveFinite(this.relaxTol, "relaxTol");
    requirePositiveFinite(this.divTol, "divTol");
    if (!Number.isSafeInteger(this.relaxMaxSweeps) || this.relaxMaxSweeps <= 0) {
      throw new Error("relaxMaxSweeps must be a positive safe integer");
    }
    if (!Number.isSafeInteger(this.rngSeed) || this.rngSeed < 0 || this.rngSeed > 0xffff_ffff) {
      throw new Error("rngSeed must be a uint32 integer");
    }
    if (!Number.isFinite(this.noiseEpsilon) || this.noiseEpsilon < 0 || this.noiseEpsilon > 1) {
      throw new Error("noiseEpsilon must be finite and in [0, 1]");
    }
    if (this.domain !== "box" && this.domain !== "hexPrism") {
      throw new Error(`domain is invalid: ${String(this.domain)}`);
    }
    if (this.farField !== "dirichlet" && this.farField !== "reflecting") {
      throw new Error(`farField is invalid: ${String(this.farField)}`);
    }
    if (
      this.center.length !== 3 ||
      this.center.some(
        (coordinate, axis) =>
          !Number.isSafeInteger(coordinate) ||
          coordinate < 0 ||
          coordinate >= (axis === 0 ? this.dims.nx : axis === 1 ? this.dims.ny : this.dims.nz),
      )
    ) {
      throw new Error("center must contain three in-domain integer coordinates");
    }
    // Drift is unsupported STRUCTURALLY and at runtime (round-3 review: TypeScript's type
    // check does not bind JS callers; §4.4 component 5 promises rejection, so reject).
    if ("phi" in options) {
      throw new Error("drift phi is unsupported under LibbrechtKinetics (attachment-kinetics §4.4)");
    }

    requirePositiveFinite(this.dxM, "derived dxM");
    const initialScales = deriveEnvironmentScales(
      this.tempC,
      this.sigmaInfinity,
      this.pressurePa,
      this.dxM,
    );
    this._vKinMS = initialScales.vKinMS;
    this._x0M = initialScales.x0M;
    this._mIceLedger = initialScales.mIceLedger;
    this._maximumKineticVelocityScaleMS = initialScales.maximumKineticVelocityScaleMS;
    this._maximumKineticFillRateScalePerSecond =
      initialScales.maximumKineticFillRateScalePerSecond;
    // Positive raw inputs are not enough: IEEE-754 conversion/derived arithmetic can still
    // collapse an accepted run (for example Number.MIN_VALUE µm -> dxM === 0, or an
    // underflow-scale pressure -> X_0 === Infinity). Validate every derived scale the
    // update actually divides or multiplies before allocating fields. The factor 6 is the
    // largest possible hex-prism face sum, (2/3)·nT + nZ with nT <= 6 and nZ <= 2.

    const { nx, ny, nz } = this.dims;
    this.a = new Uint8Array(n);
    this.f = new Float64Array(n);
    this.sigma = new Float64Array(n);
    this.wall = new Uint8Array(n);
    this.blocked = new Uint8Array(n);
    this.scratch1 = new Float64Array(n);
    this.scratch2 = new Float64Array(n);
    this.sEff = new Float64Array(n);
    this.boundaryAlphaHK = new Float64Array(n);
    this.boundarySigma = new Float64Array(n);
    this.boundarySigmaOpp = new Float64Array(n);
    this.inBoundary = new Uint8Array(n);
    this.nTAtt = new Uint8Array(n);
    this.nZAtt = new Uint8Array(n);

    const [ic, jc, kc] = this.center;
    const shell: number[] = [];
    if (this.domain === "hexPrism") {
      const radius = Math.min(ic, nx - 1 - ic, jc, ny - 1 - jc);
      const halfZ = Math.min(kc, nz - 1 - kc);
      this.hexRadius = radius;
      this.zHalfExtent = halfZ;
      let active = 0;
      for (let k = 0; k < nz; k++) {
        for (let j = 0; j < ny; j++) {
          for (let i = 0; i < nx; i++) {
            const x = k * nx * ny + j * nx + i;
            const dist = hexDistance(i - ic, j - jc);
            const inHex = dist <= radius && Math.abs(k - kc) <= halfZ;
            if (inHex) {
              active++;
              this.sigma[x] = this.sigmaInfinity;
              if (dist === radius || Math.abs(k - kc) === halfZ) shell.push(x);
            } else {
              this.wall[x] = 1;
              this.blocked[x] = 1;
            }
          }
        }
      }
      this.activeCellCount = active;
    } else {
      this.hexRadius = -1;
      this.zHalfExtent = -1;
      this.sigma.fill(this.sigmaInfinity);
      this.activeCellCount = n;
      const pushed = new Uint8Array(n);
      const push = (x: number): void => {
        if (pushed[x] === 0) {
          pushed[x] = 1;
          shell.push(x);
        }
      };
      for (let k = 0; k < nz; k++) {
        for (let j = 0; j < ny; j++) {
          push(k * nx * ny + j * nx);
          push(k * nx * ny + j * nx + nx - 1);
        }
        for (let i = 0; i < nx; i++) {
          push(k * nx * ny + i);
          push(k * nx * ny + (ny - 1) * nx + i);
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          push(j * nx + i);
          push((nz - 1) * nx * ny + j * nx + i);
        }
      }
    }
    this.dirichletCells = Int32Array.from(shell);

    const seedRadius = options.seedRadius === undefined ? 2 : options.seedRadius;
    if (seedRadius !== null) {
      const sites = hexSeedSites(this.dims, seedRadius, options.seedThickness ?? 1, this.center);
      for (const site of sites) {
        if (this.wall[site] === 1) throw new Error("seed does not fit the active domain");
        this.attachCell(site);
      }
      this.rebuildBoundaryList();
    }
    if (options.testExtraSeedSites !== undefined) {
      for (const site of options.testExtraSeedSites) {
        if (!Number.isSafeInteger(site) || site < 0 || site >= cellCount(this.dims)) {
          throw new Error(`extra seed site must be an in-domain integer, got ${String(site)}`);
        }
        if (this.wall[site] === 1) throw new Error("extra seed site is a wall cell");
        this.attachCell(site);
      }
      this.rebuildBoundaryList();
    }
  }

  get tempC(): number {
    return this._tempC;
  }

  get tick(): number {
    return this._tick;
  }

  get sigmaInfinity(): number {
    return this._sigmaInfinity;
  }

  get vKinMS(): number {
    return this._vKinMS;
  }

  get x0M(): number {
    return this._x0M;
  }

  get mIceLedger(): number {
    return this._mIceLedger;
  }

  get maximumKineticVelocityScaleMS(): number {
    return this._maximumKineticVelocityScaleMS;
  }

  get maximumKineticFillRateScalePerSecond(): number {
    return this._maximumKineticFillRateScalePerSecond;
  }

  timelineEnvironment(): LKTimelineEnvironment {
    return { tempC: this.tempC, sigmaInfinity: this.sigmaInfinity };
  }

  /**
   * This operator's own interface-cycle phase. Read-only: it reports the guard state that
   * relaxField()/advanceSurface()/applyTimelineEnvironment() already enforce and never sets it.
   */
  cyclePhase(): LKCycleState {
    return this.cycleState;
  }

  /**
   * Ice-cell fill-ledger value at the start of the current constant-temperature segment. It is
   * the ledger's own segment origin, not a re-derivation from the vapor-unit total.
   */
  currentTemperatureSegmentStartFillIceCells(): number {
    return this.currentTemperatureSegmentStartFill;
  }

  private currentDerivedScales(): LKEnvironmentDerivedScales {
    return {
      cSatPerCubicMeter: cSat(this.tempC),
      vKinMS: this.vKinMS,
      x0M: this.x0M,
      mIceLedger: this.mIceLedger,
      maximumKineticVelocityScaleMS: this.maximumKineticVelocityScaleMS,
      maximumKineticFillRateScalePerSecond: this.maximumKineticFillRateScalePerSecond,
    };
  }

  private placedFillVaporUnits(): number {
    return (
      this.closedPlacedFillVaporUnits +
      (this.fillLedger - this.currentTemperatureSegmentStartFill) * this.mIceLedger
    );
  }

  /**
   * Apply ADR 0011's abrupt LK environment event. All validation, derived arithmetic, and the
   * full O(domain) density transform are staged before any live control, field, cache, or
   * ledger is touched.
   */
  applyTimelineEnvironment(environment: LKTimelineEnvironment): LKEnvironmentTransitionReport {
    if (this.cycleState !== "boundary") {
      throw new Error(
        `LK timeline environment requires a completed interface-cycle boundary (state=${this.cycleState})`,
      );
    }
    this.cycleState = "transitioning";
    try {
      const target = snapshotTimelineEnvironment(environment);
      const beforeEnvironment = this.timelineEnvironment();
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

      const derivedBefore = this.currentDerivedScales();
      const derivedAfter = deriveEnvironmentScales(
        target.tempC,
        target.sigmaInfinity,
        this.pressurePa,
        this.dxM,
      );
      const temperatureChanged = !Object.is(target.tempC, this.tempC);
      const cSatRatioOldToNew =
        derivedBefore.cSatPerCubicMeter / derivedAfter.cSatPerCubicMeter;
      requirePositiveFinite(cSatRatioOldToNew, "temperature density ratio");

      const stagedSigma = this.sigma.slice();
      const shellMask = new Uint8Array(this.sigma.length);
      for (let position = 0; position < this.dirichletCells.length; position++) {
        shellMask[this.dirichletCells[position]] = 1;
      }
      let activeUnattachedCellCount = 0;
      let activeUnattachedShellCellCount = 0;
      let absoluteNumberDensitySumBefore = 0;
      let absoluteNumberDensitySumBeforeCompensation = 0;
      let absoluteNumberDensitySumAfter = 0;
      let absoluteNumberDensitySumAfterCompensation = 0;
      let maxCellAbsoluteNumberDensityError = 0;
      let maxCellRelativeNumberDensityError = 0;
      const addBefore = (value: number): void => {
        const sum = absoluteNumberDensitySumBefore + value;
        absoluteNumberDensitySumBeforeCompensation +=
          Math.abs(absoluteNumberDensitySumBefore) >= Math.abs(value)
            ? absoluteNumberDensitySumBefore - sum + value
            : value - sum + absoluteNumberDensitySumBefore;
        absoluteNumberDensitySumBefore = sum;
      };
      const addAfter = (value: number): void => {
        const sum = absoluteNumberDensitySumAfter + value;
        absoluteNumberDensitySumAfterCompensation +=
          Math.abs(absoluteNumberDensitySumAfter) >= Math.abs(value)
            ? absoluteNumberDensitySumAfter - sum + value
            : value - sum + absoluteNumberDensitySumAfter;
        absoluteNumberDensitySumAfter = sum;
      };

      for (let index = 0; index < this.sigma.length; index++) {
        if (this.a[index] === 1 || this.wall[index] === 1) continue;
        const sigmaOld = this.sigma[index];
        if (!Number.isFinite(sigmaOld) || sigmaOld < -1) {
          throw new Error(
            `active LK sigma[${index}] must be finite and >= -1 before a temperature event`,
          );
        }
        activeUnattachedCellCount++;
        if (shellMask[index] === 1) activeUnattachedShellCellCount++;
        const densityBefore = (1 + sigmaOld) * derivedBefore.cSatPerCubicMeter;
        const sigmaNew = temperatureChanged
          ? (1 + sigmaOld) * derivedBefore.cSatPerCubicMeter /
              derivedAfter.cSatPerCubicMeter -
            1
          : sigmaOld;
        if (!Number.isFinite(sigmaNew) || sigmaNew < -1) {
          throw new Error(`density transform produced a nonphysical sigma at cell ${index}`);
        }
        stagedSigma[index] = sigmaNew;
        const densityAfter = (1 + sigmaNew) * derivedAfter.cSatPerCubicMeter;
        if (!Number.isFinite(densityBefore) || !Number.isFinite(densityAfter)) {
          throw new Error(`density transform overflowed at active cell ${index}`);
        }
        addBefore(densityBefore);
        addAfter(densityAfter);
        const absoluteError = Math.abs(densityAfter - densityBefore);
        const relativeError = absoluteError / Math.max(Math.abs(densityBefore), 1e-300);
        if (absoluteError > maxCellAbsoluteNumberDensityError) {
          maxCellAbsoluteNumberDensityError = absoluteError;
        }
        if (relativeError > maxCellRelativeNumberDensityError) {
          maxCellRelativeNumberDensityError = relativeError;
        }
      }
      absoluteNumberDensitySumBefore += absoluteNumberDensitySumBeforeCompensation;
      absoluteNumberDensitySumAfter += absoluteNumberDensitySumAfterCompensation;
      if (
        !Number.isFinite(absoluteNumberDensitySumBefore) ||
        !Number.isFinite(absoluteNumberDensitySumAfter) ||
        !Number.isFinite(maxCellAbsoluteNumberDensityError) ||
        !Number.isFinite(maxCellRelativeNumberDensityError)
      ) {
        throw new Error("density-transform diagnostics must remain finite");
      }

      const transformedCellCount = temperatureChanged ? activeUnattachedCellCount : 0;
      const transformedDirichletShellCellCount =
        temperatureChanged && this.farField === "dirichlet"
          ? activeUnattachedShellCellCount
          : 0;
      const report: LKEnvironmentTransitionReport = {
        operator: "LibbrechtKinetics",
        boundary: {
          phase: "completedCycleBoundary",
          completedCycles: this.tick,
          tick: this.tick,
          simTimeSeconds: this.simTimeSeconds,
        },
        beforeEnvironment,
        afterEnvironment: {
          tempC: target.tempC,
          sigmaInfinity: target.sigmaInfinity,
        },
        densityTransform: {
          temperatureChanged,
          cSatRatioOldToNew,
          activeUnattachedCellCount,
          transformedCellCount,
          transformedInteriorCellCount:
            transformedCellCount - transformedDirichletShellCellCount,
          transformedDirichletShellCellCount,
          absoluteNumberDensitySumBefore,
          absoluteNumberDensitySumAfter,
          maxCellAbsoluteNumberDensityError,
          maxCellRelativeNumberDensityError,
        },
        reservoir: {
          farField: this.farField,
          activeUnattachedShellCellCount,
          shellReclampPending: this.farField === "dirichlet",
          shellClampTargetBefore: this.sigmaInfinity,
          shellClampTargetAfter: target.sigmaInfinity,
        },
        derivedBefore,
        derivedAfter,
      };

      const stagedClosedPlacedFillVaporUnits = temperatureChanged
        ? this.placedFillVaporUnits()
        : this.closedPlacedFillVaporUnits;
      const stagedTemperatureSegmentStartFill = temperatureChanged
        ? this.fillLedger
        : this.currentTemperatureSegmentStartFill;

      // Commit block: no operation below can reject. The event itself advances no physical time
      // and changes no topology/fill/ledger state. The ordinary next relaxation reclamps the
      // transformed Dirichlet shell to its newly explicit reservoir target.
      this.sigma.set(stagedSigma);
      this._tempC = target.tempC;
      this._sigmaInfinity = target.sigmaInfinity;
      this._vKinMS = derivedAfter.vKinMS;
      this._x0M = derivedAfter.x0M;
      this._mIceLedger = derivedAfter.mIceLedger;
      this._maximumKineticVelocityScaleMS = derivedAfter.maximumKineticVelocityScaleMS;
      this._maximumKineticFillRateScalePerSecond =
        derivedAfter.maximumKineticFillRateScalePerSecond;
      this.closedPlacedFillVaporUnits = stagedClosedPlacedFillVaporUnits;
      this.currentTemperatureSegmentStartFill = stagedTemperatureSegmentStartFill;
      this.sEff.fill(0);
      this.boundaryAlphaHK.fill(0);
      this.boundarySigma.fill(0);
      this.boundarySigmaOpp.fill(0);
      this.lastRelaxation = null;
      this.lastMaxFillVelocityMS = 0;
      this.cycleState = "boundary";
      return report;
    } catch (error) {
      this.cycleState = "boundary";
      throw error;
    }
  }

  private forEachNeighbor(
    i: number,
    j: number,
    k: number,
    fn: (index: number, isZ: boolean) => void,
  ): void {
    const { nx, ny, nz } = this.dims;
    const plane = nx * ny;
    const base = k * plane + j * nx + i;
    if (i + 1 < nx) fn(base + 1, false);
    if (i - 1 >= 0) fn(base - 1, false);
    if (j + 1 < ny) fn(base + nx, false);
    if (j - 1 >= 0) fn(base - nx, false);
    if (i + 1 < nx && j - 1 >= 0) fn(base + 1 - nx, false);
    if (i - 1 >= 0 && j + 1 < ny) fn(base - 1 + nx, false);
    if (k + 1 < nz) fn(base + plane, true);
    if (k - 1 >= 0) fn(base - plane, true);
  }

  private attachCell(index: number): void {
    if (this.a[index] === 1) return;
    this.a[index] = 1;
    this.blocked[index] = 1;
    this.f[index] = 1;
    this.sigma[index] = 0;
    this.attachedCount++;

    const { nx, ny } = this.dims;
    const plane = nx * ny;
    const i = index % nx;
    const j = ((index % plane) - i) / nx;
    const k = (index - j * nx - i) / plane;
    if (i < this.iMin) this.iMin = i;
    if (i > this.iMax) this.iMax = i;
    if (j < this.jMin) this.jMin = j;
    if (j > this.jMax) this.jMax = j;
    if (k < this.kMin) this.kMin = k;
    if (k > this.kMax) this.kMax = k;

    this.forEachNeighbor(i, j, k, (nIndex, isZ) => {
      if (isZ) this.nZAtt[nIndex]++;
      else this.nTAtt[nIndex]++;
      if (this.blocked[nIndex] === 0 && this.inBoundary[nIndex] === 0) {
        this.inBoundary[nIndex] = 1;
        this.boundaryList.push(nIndex);
      }
    });
  }

  private rebuildBoundaryList(): void {
    this.boundaryList = this.boundaryList.filter((index) => {
      if (this.a[index] === 1) {
        this.inBoundary[index] = 0;
        return false;
      }
      return true;
    });
  }

  facetClassOf(index: number): FacetClass {
    return classifyFacet(this.nTAtt[index], this.nZAtt[index], this.surfacePolicy);
  }

  /**
   * alphaHK of a boundary cell given sigma_surf. Noise is folded in here so the boundary
   * condition and interface update see the same deterministic coefficient for this tick.
   */
  private cellAlphaHK(index: number, sigmaSurf: number): number {
    const facet = this.facetClassOf(index);
    let a =
      this.testAlphaOverride !== undefined
        ? this.testAlphaOverride(facet, this.tempC, sigmaSurf)
        : alphaHK(facet, this.tempC, sigmaSurf, this.paramSet);
    if (this.noiseEpsilon > 0) {
      a *=
        1 - this.noiseEpsilon * randomBit(this.rngSeed, index, this.tick, STREAM_NOISE_ALPHA_HK);
    }
    if (!Number.isFinite(a) || a < 0 || a > 1) {
      throw new Error(`alphaHK must be finite and in [0, 1] (cell ${index}, got ${String(a)})`);
    }
    return a;
  }

  /**
   * Legacy-v3-only self-consistent surface values at a boundary cell (§4.4's preserved
   * executed-policy block). The legacy discrete Robin substitution implies a surface value
   * sigma_face = sigma_cell/(1+s) one half-step below the cell sample, and BOTH the vapor
   * sink and the Hertz-Knudsen growth must use that same sigma_face — the first
   * implementation grew at the cell value while absorbing at the face value, overdriving
   * growth by O(dx/X_0) (a factor ~1.6-2.4 at the gate's dx/X_0 = 2.45). alphaHK depends on
   * sigma_face, so the pair is solved by damped fixed-point iteration: g(sf) =
   * sigma_cell/(1 + alphaHK(sf)·dx/X_0) is monotone decreasing in sf, and the damped
   * iterate converges; 60 iterations or 1e-13 relative, deterministic, order-free.
   */
  private solveFace(index: number, sigmaCellRaw: number): {
    alphaHKFace: number;
    sEff: number;
    sigmaFace: number;
  } {
    if (!Number.isFinite(sigmaCellRaw)) {
      throw new Error(`solveFace requires finite sigma (cell ${index}, got ${String(sigmaCellRaw)})`);
    }
    const sigmaCell = Math.max(sigmaCellRaw, 0);
    const ratio = this.dxM / this.x0M;
    if (sigmaCell === 0) {
      const a0 = this.cellAlphaHK(index, 0);
      const s0 = a0 * ratio;
      return { alphaHKFace: a0, sEff: s0 / (1 + s0), sigmaFace: 0 };
    }
    let sf = sigmaCell;
    for (let it = 0; it < 60; it++) {
      const a = this.cellAlphaHK(index, sf);
      const next = sigmaCell / (1 + a * ratio);
      if (Math.abs(next - sf) <= 1e-13 * sigmaCell) {
        sf = next;
        break;
      }
      sf = 0.5 * (sf + next);
    }
    const alphaHKFace = this.cellAlphaHK(index, sf);
    const s = alphaHKFace * ratio;
    const sigmaFace = sigmaCell / (1 + s);
    // Verify the nonlinear residual instead of trusting the iteration count (round-3
    // review): a fixed point that did not actually converge is a silent physics error.
    if (Math.abs(sigmaFace - sf) > 1e-9 * sigmaCell) {
      throw new Error(
        `solveFace did not converge (cell ${index}: sigma_face ${sigmaFace} vs iterate ${sf})`,
      );
    }
    return { alphaHKFace, sEff: s / (1 + s), sigmaFace };
  }

  /**
   * Eq. 5.35 opposing-vapor mean for aggregate-hv-g1h1-v4/v5/v6. Each attached direction
   * nominates the cell in the opposite direction; only active unattached vapor cells enter
   * the mask. The primary [01]/[20] facets therefore have exactly H+V samples.
   *
   * The operands are gathered in a fixed lattice-direction order (+i, -i, +j, -j, +i-j,
   * -i+j, +k, -k), and rot60 permutes those positions by the cycle (1 3 6 2 4 5), which is
   * not order-preserving. Float64 addition is not associative, so summing in gather order
   * makes this value differ by ~1 ulp between symmetry-equivalent cells once three or more
   * operands are present — the D6h defect ADR 0023 records. V6 sums in ascending value order
   * instead, which depends only on the operand multiset and is therefore equivariant; v4/v5
   * keep the gather-order sum verbatim so their executed evidence stays reproducible.
   */
  private opposingSigma(index: number, input: Float64Array): number {
    const { nx, ny, nz } = this.dims;
    const plane = nx * ny;
    const i = index % nx;
    const inPlane = index % plane;
    const j = (inPlane - i) / nx;
    const k = (index - inPlane) / plane;
    const operands = this.canonicalOpposingOrder ? this.opposingOperands : null;
    let sum = 0;
    let count = 0;
    const include = (attached: number, opposite: number): void => {
      if (this.a[attached] === 1 && this.blocked[opposite] === 0) {
        if (operands !== null) operands[count] = input[opposite];
        else sum += input[opposite];
        count++;
      }
    };
    if (i + 1 < nx && i - 1 >= 0) include(index + 1, index - 1);
    if (i - 1 >= 0 && i + 1 < nx) include(index - 1, index + 1);
    if (j + 1 < ny && j - 1 >= 0) include(index + nx, index - nx);
    if (j - 1 >= 0 && j + 1 < ny) include(index - nx, index + nx);
    if (i + 1 < nx && j - 1 >= 0 && i - 1 >= 0 && j + 1 < ny) {
      include(index + 1 - nx, index - 1 + nx);
    }
    if (i - 1 >= 0 && j + 1 < ny && i + 1 < nx && j - 1 >= 0) {
      include(index - 1 + nx, index + 1 - nx);
    }
    if (k + 1 < nz && k - 1 >= 0) include(index + plane, index - plane);
    if (k - 1 >= 0 && k + 1 < nz) include(index - plane, index + plane);
    if (count === 0) return 0;
    if (operands !== null) {
      // Insertion sort over at most 8 operands: the same multiset always sums in the same
      // order, so the result is a function of the multiset alone. Matches the ascending-order
      // rule the in-plane smoother already applies to its three pair sums.
      for (let m = 1; m < count; m++) {
        const value = operands[m];
        let n = m - 1;
        while (n >= 0 && operands[n] > value) {
          operands[n + 1] = operands[n];
          n--;
        }
        operands[n + 1] = value;
      }
      for (let m = 0; m < count; m++) sum += operands[m];
    }
    return sum / count;
  }

  /** Self-consistent monograph Eq. 5.34 boundary value, with aggregate-v4/v5/v6 G_b = 1. */
  private solveAggregateBoundary(index: number, input: Float64Array): {
    alphaHKBoundary: number;
    sigmaBoundary: number;
    sigmaOpp: number;
  } {
    const sigmaOppRaw = this.opposingSigma(index, input);
    if (!Number.isFinite(sigmaOppRaw)) {
      throw new Error(
        `aggregate boundary solve requires finite sigma_opp (cell ${index}, got ${String(sigmaOppRaw)})`,
      );
    }
    const sigmaOpp = sigmaOppRaw;
    if (sigmaOpp <= 0) {
      // ADR 0011: a density-conserving temperature event may truthfully produce
      // subsaturation. Preserve that potential exactly; the no-sublimation production law
      // has zero attachment coefficient and therefore zero kinetic demand here.
      return {
        alphaHKBoundary: 0,
        sigmaBoundary: sigmaOpp,
        sigmaOpp,
      };
    }
    const ratio = this.dxM / this.x0M; // G_b = 1 under aggregate-hv-g1h1-v4/v5/v6
    let sigmaBoundary = sigmaOpp;
    for (let iteration = 0; iteration < 60; iteration++) {
      const coefficient = this.cellAlphaHK(index, sigmaBoundary);
      const next = sigmaOpp / (1 + coefficient * ratio);
      if (Math.abs(next - sigmaBoundary) <= 1e-13 * sigmaOpp) {
        sigmaBoundary = next;
        break;
      }
      sigmaBoundary = 0.5 * (sigmaBoundary + next);
    }
    const alphaHKBoundary = this.cellAlphaHK(index, sigmaBoundary);
    const solved = sigmaOpp / (1 + alphaHKBoundary * ratio);
    if (Math.abs(solved - sigmaBoundary) > 1e-9 * sigmaOpp) {
      throw new Error(
        `aggregate boundary solve did not converge (cell ${index}: sigma_b ${solved} vs iterate ${sigmaBoundary})`,
      );
    }
    return { alphaHKBoundary, sigmaBoundary: solved, sigmaOpp };
  }

  /** Legacy-v3 only: recompute the Robin factor from the current field (Picard). */
  private updateSEff(input: Float64Array): void {
    for (const x of this.boundaryList) {
      this.sEff[x] = this.solveFace(x, input[x]).sEff;
    }
  }

  /**
   * One Jacobi sweep of the §4.4 relaxation: the 2a kernel (canonical pair summation) with
   * the Robin substitution at attached faces (wall faces still reflect), then the Dirichlet
   * clamp. Returns [maxAbsChange, injection, absorption] for convergence and the divergence
   * identity. Reads `src`, writes `dst`.
   */
  private sweepLegacy(
    src: Float64Array,
    dst: Float64Array,
  ): [number, number, number, null] {
    const { nx, ny, nz } = this.dims;
    const plane = nx * ny;
    const blocked = this.blocked;
    const wall = this.wall;
    const a = this.a;
    const out1 = this.scratch1;
    this.updateSEff(src);
    const sEff = this.sEff;
    let absorption = 0;

    // (1a) in-plane, reflecting at walls/faces, Robin at attached faces.
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      for (let j = 0; j < ny; j++) {
        const row = kBase + j * nx;
        for (let i = 0; i < nx; i++) {
          const x = row + i;
          if (blocked[x] === 1) {
            out1[x] = 0;
            continue;
          }
          const own = src[x];
          const robin = own * (1 - sEff[x]);
          const absorbShare = (own - robin) / 7;
          // Inlined per direction (round-3: a closure per cell per sweep dominated the 96^3
          // wall time). Semantics identical: domain face / wall -> reflect (own); free ->
          // neighbor value; attached face -> Robin value, absorption accounted.
          let east: number, west: number, ne: number, sw: number, se: number, nw: number;
          let nIdx: number;
          if (i + 1 >= nx) east = own;
          else if (blocked[(nIdx = x + 1)] === 0) east = src[nIdx];
          else if (wall[nIdx] === 1) east = own;
          else { absorption += absorbShare; east = robin; }
          if (i - 1 < 0) west = own;
          else if (blocked[(nIdx = x - 1)] === 0) west = src[nIdx];
          else if (wall[nIdx] === 1) west = own;
          else { absorption += absorbShare; west = robin; }
          if (j + 1 >= ny) ne = own;
          else if (blocked[(nIdx = x + nx)] === 0) ne = src[nIdx];
          else if (wall[nIdx] === 1) ne = own;
          else { absorption += absorbShare; ne = robin; }
          if (j - 1 < 0) sw = own;
          else if (blocked[(nIdx = x - nx)] === 0) sw = src[nIdx];
          else if (wall[nIdx] === 1) sw = own;
          else { absorption += absorbShare; sw = robin; }
          if (i + 1 >= nx || j - 1 < 0) se = own;
          else if (blocked[(nIdx = x + 1 - nx)] === 0) se = src[nIdx];
          else if (wall[nIdx] === 1) se = own;
          else { absorption += absorbShare; se = robin; }
          if (i - 1 < 0 || j + 1 >= ny) nw = own;
          else if (blocked[(nIdx = x - 1 + nx)] === 0) nw = src[nIdx];
          else if (wall[nIdx] === 1) nw = own;
          else { absorption += absorbShare; nw = robin; }
          const p1 = east + west;
          const p2 = ne + sw;
          const p3 = se + nw;
          let lo: number, mid: number, hi: number;
          if (p1 <= p2) {
            if (p2 <= p3) {
              lo = p1; mid = p2; hi = p3;
            } else if (p1 <= p3) {
              lo = p1; mid = p3; hi = p2;
            } else {
              lo = p3; mid = p1; hi = p2;
            }
          } else if (p1 <= p3) {
            lo = p2; mid = p1; hi = p3;
          } else if (p2 <= p3) {
            lo = p2; mid = p3; hi = p1;
          } else {
            lo = p3; mid = p2; hi = p1;
          }
          out1[x] = (((own + lo) + mid) + hi) / 7;
        }
      }
    }

    // (1b) vertical, same substitution rules. NOTE: the Robin factor here uses the SAME
    // s_eff (from the pre-sweep field), applied to the (1a) output — first-order consistent.
    let maxAbs = 0;
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      const hasUp = k + 1 < nz;
      const hasDown = k - 1 >= 0;
      for (let p = 0; p < plane; p++) {
        const x = kBase + p;
        if (blocked[x] === 1) {
          dst[x] = 0;
          continue;
        }
        const own = out1[x];
        const robin = own * (1 - sEff[x]);
        let up: number;
        if (!hasUp) up = own;
        else if (blocked[x + plane] === 0) up = out1[x + plane];
        else if (wall[x + plane] === 1) up = own;
        else {
          absorption += (3 / 14) * (own - robin);
          up = robin;
        }
        let down: number;
        if (!hasDown) down = own;
        else if (blocked[x - plane] === 0) down = out1[x - plane];
        else if (wall[x - plane] === 1) down = own;
        else {
          absorption += (3 / 14) * (own - robin);
          down = robin;
        }
        dst[x] = (4 / 7) * own + (3 / 14) * (up + down);
      }
    }

    // Dirichlet clamp at the far-field shell (skipped in the reflecting diagnostic mode).
    let injection = 0;
    if (this.farField === "dirichlet") {
      const target = this.sigmaInfinity;
      for (let c = 0; c < this.dirichletCells.length; c++) {
        const x = this.dirichletCells[c];
        if (blocked[x] === 1) continue;
        injection += target - dst[x];
        dst[x] = target;
      }
    }

    const n = plane * nz;
    for (let x = 0; x < n; x++) {
      if (a[x] === 0 && wall[x] === 0) {
        const change = Math.abs(dst[x] - src[x]);
        if (change > maxAbs) maxAbs = change;
      }
    }
    return [maxAbs, injection, absorption, null];
  }

  /**
   * Aggregate-v4/v5 sweep. The interior pass is the Phase 2a reflecting kernel. Boundary pixels
   * are then replaced by Eq. 5.34, and the signed replacement total is the numerical surface
   * exchange used only by the divergence diagnostic. Local exchange may be negative.
   */
  private sweepAggregate(
    src: Float64Array,
    dst: Float64Array,
  ): [number, number, number, number, number | null, number | null] {
    const { nx, ny, nz } = this.dims;
    const plane = nx * ny;
    const blocked = this.blocked;
    const wall = this.wall;
    const attached = this.a;
    const out1 = this.scratch1;
    const smootherDrift =
      metersSmootherDrift(this.surfacePolicy) ? new BlockCompensatedSum() : null;
    let maxAbsSweepInput = 0;

    // In-plane reflecting pass, with the exact canonical pair summation used by the oracle.
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      for (let j = 0; j < ny; j++) {
        const row = kBase + j * nx;
        for (let i = 0; i < nx; i++) {
          const x = row + i;
          if (blocked[x] === 1) {
            out1[x] = 0;
            continue;
          }
          const own = src[x];
          let east: number, west: number, ne: number, sw: number, se: number, nw: number;
          let neighbor: number;
          if (i + 1 >= nx) east = own;
          else if (blocked[(neighbor = x + 1)] === 0) east = src[neighbor];
          else east = own;
          if (i - 1 < 0) west = own;
          else if (blocked[(neighbor = x - 1)] === 0) west = src[neighbor];
          else west = own;
          if (j + 1 >= ny) ne = own;
          else if (blocked[(neighbor = x + nx)] === 0) ne = src[neighbor];
          else ne = own;
          if (j - 1 < 0) sw = own;
          else if (blocked[(neighbor = x - nx)] === 0) sw = src[neighbor];
          else sw = own;
          if (i + 1 >= nx || j - 1 < 0) se = own;
          else if (blocked[(neighbor = x + 1 - nx)] === 0) se = src[neighbor];
          else se = own;
          if (i - 1 < 0 || j + 1 >= ny) nw = own;
          else if (blocked[(neighbor = x - 1 + nx)] === 0) nw = src[neighbor];
          else nw = own;
          const p1 = east + west;
          const p2 = ne + sw;
          const p3 = se + nw;
          let lo: number, mid: number, hi: number;
          if (p1 <= p2) {
            if (p2 <= p3) {
              lo = p1;
              mid = p2;
              hi = p3;
            } else if (p1 <= p3) {
              lo = p1;
              mid = p3;
              hi = p2;
            } else {
              lo = p3;
              mid = p1;
              hi = p2;
            }
          } else if (p1 <= p3) {
            lo = p2;
            mid = p1;
            hi = p3;
          } else if (p2 <= p3) {
            lo = p2;
            mid = p3;
            hi = p1;
          } else {
            lo = p3;
            mid = p2;
            hi = p1;
          }
          out1[x] = (((own + lo) + mid) + hi) / 7;
        }
      }
    }

    // Vertical reflecting pass.
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      const hasUp = k + 1 < nz;
      const hasDown = k - 1 >= 0;
      for (let p = 0; p < plane; p++) {
        const x = kBase + p;
        if (blocked[x] === 1) {
          dst[x] = 0;
          continue;
        }
        if (smootherDrift !== null) {
          const magnitude = Math.abs(src[x]);
          if (magnitude > maxAbsSweepInput) maxAbsSweepInput = magnitude;
        }
        const own = out1[x];
        const up = hasUp && blocked[x + plane] === 0 ? out1[x + plane] : own;
        const down = hasDown && blocked[x - plane] === 0 ? out1[x - plane] : own;
        const candidate = (4 / 7) * own + (3 / 14) * (up + down);
        dst[x] = candidate;
        if (smootherDrift !== null) smootherDrift.add(candidate - src[x]);
      }
    }

    // Aggregate nonlinear boundary solve from ONE immutable post-smoother candidate. Do not
    // read src here: decision 0009's registered order is smoother -> boundary replacement ->
    // clamp. Do not replace dst in this loop either: an opposing pixel may itself be a
    // boundary pixel, so in-place replacement would make the answer boundary-list-order
    // dependent (a hidden Gauss-Seidel/D6h defect).
    let surfaceExchange = 0;
    let minLocalSurfaceExchange = Infinity;
    for (const x of this.boundaryList) {
      const boundary = this.solveAggregateBoundary(x, dst);
      const localExchange = dst[x] - boundary.sigmaBoundary;
      surfaceExchange += localExchange;
      if (localExchange < minLocalSurfaceExchange) minLocalSurfaceExchange = localExchange;
      this.boundaryAlphaHK[x] = boundary.alphaHKBoundary;
      this.boundarySigma[x] = boundary.sigmaBoundary;
      this.boundarySigmaOpp[x] = boundary.sigmaOpp;
    }
    for (const x of this.boundaryList) dst[x] = this.boundarySigma[x];
    if (minLocalSurfaceExchange === Infinity) minLocalSurfaceExchange = 0;

    let injection = 0;
    if (this.farField === "dirichlet") {
      const target = this.sigmaInfinity;
      for (let cell = 0; cell < this.dirichletCells.length; cell++) {
        const x = this.dirichletCells[cell];
        if (blocked[x] === 1) continue;
        injection += target - dst[x];
        dst[x] = target;
      }
    }

    let maxAbs = 0;
    const n = plane * nz;
    for (let x = 0; x < n; x++) {
      if (attached[x] === 0 && wall[x] === 0) {
        const change = Math.abs(dst[x] - src[x]);
        if (change > maxAbs) maxAbs = change;
      }
    }
    const smootherDriftValue = smootherDrift?.value() ?? null;
    const smootherDriftLimit =
      smootherDrift === null
        ? null
        : float64SmootherDriftAbsLimit(this.activeCellCount, maxAbsSweepInput);
    return [
      maxAbs,
      injection,
      surfaceExchange,
      minLocalSurfaceExchange,
      smootherDriftValue,
      smootherDriftLimit,
    ];
  }

  private sweep(
    src: Float64Array,
    dst: Float64Array,
  ): [number, number, number, number | null, number | null, number | null] {
    if (this.surfacePolicy === "legacy-v3") {
      const [maxAbs, injection, exchange, minimum] = this.sweepLegacy(src, dst);
      return [maxAbs, injection, exchange, minimum, null, null];
    }
    return this.sweepAggregate(src, dst);
  }

  /** §4.4 step 1: relax to tolerance; for Dirichlet, require the divergence identity too. */
  relaxField(onProgress?: (progress: RelaxationProgress) => void): RelaxationReport {
    if (this.cycleState !== "boundary" && this.cycleState !== "incomplete") {
      throw new Error(`LK relaxation is not allowed in state ${this.cycleState}`);
    }
    // Clear readiness and every old kinetic cache BEFORE the first sweep or callback. A
    // recursive public call therefore sees "relaxing", never a stale accepted surface.
    this.cycleState = "relaxing";
    this.lastRelaxation = null;
    this.sEff.fill(0);
    this.boundaryAlphaHK.fill(0);
    this.boundarySigma.fill(0);
    this.boundarySigmaOpp.fill(0);
    try {
      let src = this.sigma;
      let dst = this.scratch2;
      let sweeps = 0;
      let residual = Infinity;
      let injection = 0;
      let surfaceExchange = 0;
      let minLocalSurfaceExchange: number | null = null;
      let smootherDrift: number | null = null;
      let divergence = Infinity;
      while (sweeps < this.relaxMaxSweeps) {
        const [maxAbs, inj, exchange, minLocal, drift, driftLimit] = this.sweep(src, dst);
        sweeps++;
        residual = maxAbs / this.sigmaInfinity;
        injection = inj;
        surfaceExchange = exchange;
        minLocalSurfaceExchange = minLocal;
        smootherDrift = drift;
        if (
          metersSmootherDrift(this.surfacePolicy) &&
          (drift === null ||
            !Number.isFinite(drift) ||
            driftLimit === null ||
            !Number.isFinite(driftLimit) ||
            driftLimit < 0)
        ) {
          throw new Error(
            `${this.surfacePolicy} smoother drift/bound must be finite: ` +
              `drift=${String(drift)}, bound=${String(driftLimit)}`,
          );
        }
        if (
          metersSmootherDrift(this.surfacePolicy) &&
          Math.abs(drift as number) > (driftLimit as number)
        ) {
          throw new Error(
            `${this.surfacePolicy} smoother drift ${String(drift)} exceeds float64 roundoff bound ` +
              `${String(driftLimit)}`,
          );
        }
        const divergenceDifference =
          metersSmootherDrift(this.surfacePolicy)
            ? inj + (drift as number) - exchange
            : inj - exchange;
        divergence =
          this.farField === "dirichlet"
            ? Math.abs(divergenceDifference) / Math.max(Math.abs(exchange), 1e-300)
            : 0;
        const tmp = src;
        src = dst;
        dst = tmp;
        const divergenceSatisfied = this.farField !== "dirichlet" || divergence < this.divTol;
        if (onProgress !== undefined && (sweeps === 1 || sweeps % 1024 === 0)) {
          onProgress({
            sweeps,
            residual,
            divergenceResidual: this.farField === "dirichlet" ? divergence : null,
          });
        }
        // Fixed-sigma Dirichlet requires BOTH criteria. Reflecting is diagnostic-only and has
        // no source against which a divergence identity could be stated.
        if (residual < this.relaxTol && divergenceSatisfied) break;
      }
      if (src !== this.sigma) this.sigma.set(src);
      const converged =
        residual < this.relaxTol &&
        (this.farField !== "dirichlet" || divergence < this.divTol);
      const report: RelaxationReport = {
        sweeps,
        residual,
        converged,
        // The divergence identity is only defined against the Dirichlet source; in the
        // reflecting diagnostic mode there is no source and the identity is not a claim.
        divergenceResidual: this.farField === "dirichlet" ? divergence : null,
        shellClampDiagnostic: this.farField === "dirichlet" ? injection : null,
        surfaceExchangeDiagnostic: surfaceExchange,
        smootherDriftDiagnostic:
          metersSmootherDrift(this.surfacePolicy) ? smootherDrift : null,
        minLocalSurfaceExchangeDiagnostic: minLocalSurfaceExchange,
      };
      this.lastRelaxation = report;
      this.cycleState = converged ? "ready" : "incomplete";
      return report;
    } catch (error) {
      // The field may contain a completed subset of sweeps, but topology and fill have not
      // advanced. A later relaxField may retry from this explicit incomplete state.
      this.lastRelaxation = null;
      this.cycleState = "incomplete";
      throw error;
    }
  }

  /**
   * §4.4 interface update. Aggregate v4/v5 use the cached Eq. 5.34 `(alphaHK,sigma_b)` pair
   * and H_b=1 once per boundary pixel. Legacy v3 retains its named per-contact formula.
   * The adaptive fill-CFL bounds the selected policy's per-cell kinetic increment.
   */
  advanceSurface(): SurfaceReport {
    if (this.cycleState !== "ready") {
      throw new Error(
        "advanceSurface requires exactly one accepted converged relaxField; an unconverged " +
          `field or unmatched call cannot advance (state=${this.cycleState})`,
      );
    }
    this.cycleState = "advancing";
    try {
      const report = this.advanceSurfaceUpdate();
      this._tick++;
      this.cycleState = "boundary";
      return report;
    } catch (error) {
      this.cycleState = "incomplete";
      throw error;
    }
  }

  private advanceSurfaceUpdate(): SurfaceReport {
    const boundary = this.boundaryList;
    const nBoundary = boundary.length;
    const rateArr = new Float64Array(nBoundary); // per-cell fill rate, units of v/dx
    let maxRate = 0;
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      let rate: number;
      if (this.surfacePolicy === "legacy-v3") {
        const face = this.solveFace(x, this.sigma[x]);
        const velocity = face.alphaHKFace * this.vKinMS * face.sigmaFace;
        const faceFactor = (2 / 3) * this.nTAtt[x] + this.nZAtt[x];
        rate = (faceFactor * velocity) / this.dxM;
      } else {
        const velocity = this.boundaryAlphaHK[x] * this.vKinMS * this.boundarySigma[x];
        rate = velocity / this.dxM; // H_b = 1 under aggregate-hv-g1h1-v4/v5/v6
      }
      rateArr[bi] = rate;
      if (rate > maxRate) maxRate = rate;
    }
    const stagedMaxFillVelocityMS = maxRate * this.dxM;

    const toAttach: number[] = [];
    let maxKineticFillIncrement = 0;
    let deltaTime = 0;
    if (maxRate > 0) {
      deltaTime = this.cflFill / maxRate;
      for (let bi = 0; bi < nBoundary; bi++) {
        const x = boundary[bi];
        const raw = rateArr[bi] * deltaTime;
        const room = 1 - this.f[x];
        if (raw >= room) {
          this.fillLedger += room;
          this.saturationClippedFill += raw - room; // round-3 blocker 2: never silently drop
          this.f[x] = 1;
          toAttach.push(x);
          if (raw > maxKineticFillIncrement) maxKineticFillIncrement = raw;
        } else {
          this.fillLedger += raw;
          this.f[x] += raw;
          if (raw > maxKineticFillIncrement) maxKineticFillIncrement = raw;
        }
      }
      this.simTimeSeconds += deltaTime;
    }

    // Hole-filling (kept, §4.4 component 5): raw counts, decided from start-of-step state.
    // NOT fill-CFL subject (it is a geometric event, not kinetic advance) — counted and
    // deficit-ledgered SEPARATELY so the kinetic CFL claim cannot be censored by it
    // (round-2 maker review, blocker 6).
    let holeFillCount = 0;
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      if (this.f[x] < 1 && this.nTAtt[x] >= 4 && this.nZAtt[x] >= 1) {
        this.holeFillDeficit += 1 - this.f[x];
        this.f[x] = 1;
        toAttach.push(x);
        holeFillCount++;
      }
    }
    this.holeFillCountTotal += holeFillCount;

    for (const x of toAttach) this.attachCell(x);
    if (toAttach.length > 0) this.rebuildBoundaryList();
    this.lastAttached = toAttach;
    // Publish the diagnostic only after the complete interface update succeeds. A failed
    // update must continue to report the most recent completed update, never a staged value.
    this.lastMaxFillVelocityMS = stagedMaxFillVelocityMS;

    return {
      attachedNow: toAttach.length,
      maxKineticFillIncrement,
      holeFillCount,
      deltaTimeSeconds: deltaTime,
      stalled: maxRate <= 0,
      skippedUnconverged: false,
    };
  }

  /** The rule's exact bookkeeping claim, measurably (§4.4 component 6; SurfaceOperator). */
  ledger(): LedgerReport {
    const demandDescription =
      this.surfacePolicy === "legacy-v3"
        ? "legacy per-contact Hertz-Knudsen demand (sigma_face; 2/3 lateral / 1 vertical)"
        : "geometry-adjusted per-boundary-pixel Hertz-Knudsen demand (sigma_b; G_b=H_b=1)";
    return {
      rule: "LibbrechtKinetics",
      claim:
        `the fill ledger plus recorded saturation clipping integrates exactly the ${demandDescription}; ` +
        "placed-fill vapor units accumulate each interface step at that step's M_ice; " +
        "clipping is unapplied numerical excess, not deposited ice; Dirichlet solve quality " +
        "is the divergence identity over signed net numerical boundary exchange, required for " +
        "convergence there; local exchange is potential redistribution, not uptake; no " +
        "Sigma(b+d) claim exists under this rule",
      totalMassBD: null,
      dirichletMeter: null,
      fillLedgerIceCells: this.fillLedger,
      fillLedgerVaporUnits: this.placedFillVaporUnits(),
      holeFillDeficit: this.holeFillDeficit,
      saturationClippedFill: this.saturationClippedFill,
      lastDivergenceResidual: this.lastRelaxation?.divergenceResidual ?? null,
    };
  }

  /**
   * One full growth step. If the relaxation did NOT converge, the surface is NOT advanced
   * (round-2 maker review: growing on an unconverged field is a silent physics error) —
   * the caller sees converged=false and skippedUnconverged=true and must stop or re-relax.
   * Round-3 hardening: the same guard now binds the PUBLIC interface — advanceSurface()
   * itself throws without a converged relaxField for this step.
   */
  step(onProgress?: (progress: RelaxationProgress) => void): {
    relaxation: RelaxationReport;
    surface: SurfaceReport;
  } {
    if (this.cycleState !== "boundary" && this.cycleState !== "incomplete") {
      throw new Error(`LK step cannot start in state ${this.cycleState}`);
    }
    const relaxation = this.relaxField(onProgress);
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
        },
      };
    }
    const surface = this.advanceSurface();
    return { relaxation, surface };
  }

  /** Charter §3.1 guard: crystal bounding box beyond 65% of any domain extent. */
  domainContact(): boolean {
    if (this.attachedCount === 0) return false;
    return (
      this.iMax - this.iMin + 1 > DOMAIN_CONTACT_FRACTION * this.dims.nx ||
      this.jMax - this.jMin + 1 > DOMAIN_CONTACT_FRACTION * this.dims.ny ||
      this.kMax - this.kMin + 1 > DOMAIN_CONTACT_FRACTION * this.dims.nz
    );
  }

  /** Largest lattice extent of the crystal (cells) — the habit-gate measurement size. */
  largestExtent(): number {
    if (this.attachedCount === 0) return 0;
    return Math.max(this.iMax - this.iMin + 1, this.jMax - this.jMin + 1, this.kMax - this.kMin + 1);
  }

  boundarySize(): number {
    return this.boundaryList.length;
  }

  boundaryCells(): readonly number[] {
    return this.boundaryList;
  }

  neighborCounts(index: number): [number, number] {
    return [this.nTAtt[index], this.nZAtt[index]];
  }

  /** Read-only aggregate boundary state for diagnostics/UI after relaxation. */
  boundaryState(index: number): {
    readonly sigmaOpp: number;
    readonly sigmaBoundary: number;
    readonly alphaHKBoundary: number;
    readonly robinGeometry: number;
    readonly fillGeometry: number;
  } {
    if (this.surfacePolicy === "legacy-v3") {
      throw new Error("boundaryState is defined only for aggregate surface policies");
    }
    if (this.cycleState !== "ready") {
      throw new Error("boundaryState requires a currently accepted converged relaxation");
    }
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.a.length) {
      throw new Error(`boundaryState index is out of range: ${String(index)}`);
    }
    if (this.inBoundary[index] !== 1 || this.a[index] === 1) {
      throw new Error(`cell ${index} is not an active boundary pixel`);
    }
    return {
      sigmaOpp: this.boundarySigmaOpp[index],
      sigmaBoundary: this.boundarySigma[index],
      alphaHKBoundary: this.boundaryAlphaHK[index],
      robinGeometry: 1,
      fillGeometry: 1,
    };
  }
}
