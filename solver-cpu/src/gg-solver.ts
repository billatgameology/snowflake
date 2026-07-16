// The CPU oracle: Gravner-Griffeath machinery with the GGThreshold attachment rule
// (gg-machinery §4, §5, §6). Plain TypeScript, float64, environment-neutral — no Node APIs;
// all I/O lives in runner (charter §3.1, so Phase 3 can host this identical solver in a Web
// Worker).
//
// Update cycle, four steps per tick, in order:
//   (i)   diffusion  — Jacobi over ping-pong buffers, NEVER in place (in-place Gauss-Seidel
//                      is a silent physics bug); optional §6 diffusion-slowdown noise
//   (ii)  freezing   — boundary cells trade vapor for boundary mass
//   (iii) attachment — GGThreshold: hole-filling (UNCAPPED n_T >= 4 and n_Z >= 1), else
//                      b >= ggThreshBeta(n_T, n_Z). This is GGThreshold's attachment substep;
//                      LibbrechtKinetics replaces the four-step surface exchange as one coupled
//                      SurfaceOperator, not this line alone.
//   (iv)  melting    — boundary cells that did NOT just attach leak b back to d
//
// All neighbor counts are taken as they stand at the START of the tick, so attachment is
// simultaneous across the boundary. Reflecting far field only in 2a — it is what makes mass
// conservation exact (gg-machinery §4.i).
//
// Two determinism decisions this file carries (both recorded in the Phase 2 plan):
//
// 1. DOMAIN SHAPE. On a "box" domain exact D6h symmetry is geometrically impossible once the
//    depletion field feels the walls (see DomainShape in core/state). "hexPrism" masks the
//    active region to the inscribed hexagonal prism with a zmirror-symmetric z-range; wall
//    cells are inert and reflect exactly like attached cells. The 2a symmetry gate runs on
//    hexPrism; box remains for everything that does not need exact sixfold symmetry.
//
// 2. CANONICAL NEIGHBOR SUMMATION. Symmetric cells sum the same multiset of neighbor values
//    in permuted order, and float addition is not associative — a fixed enumeration order
//    makes ulp-level asymmetries possible at any preset (the plan's recorded caveat). Step
//    (1a) therefore sums opposite-direction PAIRS (e+w, ne+sw, se+nw — pairs map to pairs
//    under every D6h generator, and within-pair order is commutative hence exact), then adds
//    the three pair-sums in sorted order. Symmetric cells round identically, so the gate's
//    "exactly 0" is structural, not luck.

import {
  cellCount,
  hexDistance,
  hexSeedSites,
  paramSlot,
  domainCenter,
  randomBit,
  DOMAIN_CONTACT_FRACTION,
  STREAM_NOISE_XI,
  totalMass,
  validateParams,
  type Dims,
  type DomainShape,
  type FarFieldCondition,
  type GGParams,
  type SolverState,
} from "@vcc/core";
import type { LedgerReport, RelaxationReport, SurfaceOperator, SurfaceReport } from "./operator.ts";

export interface GGSolverOptions {
  readonly dims: Dims;
  readonly params: GGParams;
  /** PRNG seed. Only consumed when noiseEpsilon > 0, but always recorded. */
  readonly rngSeed: number;
  /** gg-machinery §6 epsilon; 0 (default) = noise off. Published guidance: order 1e-5. */
  readonly noiseEpsilon?: number;
  /** Active-domain shape; default "box". The 2a symmetry gate needs "hexPrism". */
  readonly domain?: DomainShape;
  /**
   * Far-field boundary condition (charter §2.4). Default "reflecting" — the published G-G
   * model and the ONLY condition under which the exact mass invariant holds. "dirichlet"
   * (Phase 2b) clamps the far-field shell to rho after each diffusion pass and meters the
   * injected/removed mass (a source/sink BY DESIGN — gg-machinery §4.i).
   */
  readonly farField?: FarFieldCondition;
  /**
   * Canonical seed: hexagonal plate (gg-machinery §5). radius 2, thickness 1 = 19 sites —
   * the paper's "20" is a documented erratum; do not "fix" it back. radius: null means no
   * seed at all (crystal-free control runs).
   */
  readonly seedRadius?: number | null;
  readonly seedThickness?: number;
  readonly center?: readonly [number, number, number];
}

/** §7 stopping rule: halt when far-field vapor falls below (2/3) * rho. */
export const FAR_FIELD_STOP_FRACTION = 2 / 3;

const UINT32_MAX = 0xffff_ffff;

function validateOptions(options: GGSolverOptions): readonly [number, number, number] {
  if (options === null || typeof options !== "object") {
    throw new Error("GGSolver options must be an object");
  }
  if (options.dims === null || typeof options.dims !== "object") {
    throw new Error("dims must be an object");
  }
  for (const name of ["nx", "ny", "nz"] as const) {
    const value = options.dims[name];
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`dims.${name} must be a positive safe integer, got ${value}`);
    }
  }
  const n = options.dims.nx * options.dims.ny * options.dims.nz;
  if (!Number.isSafeInteger(n)) throw new Error(`cell count must be a safe integer, got ${n}`);

  if (options.params === null || typeof options.params !== "object") {
    throw new Error("params must be an object");
  }
  for (const name of ["kappa", "mu", "ggThreshBeta"] as const) {
    if (!(options.params[name] instanceof Float64Array)) {
      throw new Error(`params.${name} must be a Float64Array`);
    }
  }
  const paramValidation = validateParams(options.params);
  if (paramValidation.errors.length > 0) {
    throw new Error(`invalid GG parameters: ${paramValidation.errors.join("; ")}`);
  }

  if (!Number.isSafeInteger(options.rngSeed) || options.rngSeed < 0 || options.rngSeed > UINT32_MAX) {
    throw new Error(`rngSeed must be a uint32, got ${options.rngSeed}`);
  }
  const noiseEpsilon = options.noiseEpsilon ?? 0;
  if (!(Number.isFinite(noiseEpsilon) && noiseEpsilon >= 0 && noiseEpsilon <= 1)) {
    throw new Error(`noiseEpsilon must be finite and in [0, 1], got ${noiseEpsilon}`);
  }
  if (options.domain !== undefined && options.domain !== "box" && options.domain !== "hexPrism") {
    throw new Error(`domain must be box or hexPrism, got ${String(options.domain)}`);
  }
  if (
    options.farField !== undefined &&
    options.farField !== "reflecting" &&
    options.farField !== "dirichlet"
  ) {
    throw new Error(`farField must be reflecting or dirichlet, got ${String(options.farField)}`);
  }

  const center = options.center ?? domainCenter(options.dims);
  if (!Array.isArray(center) || center.length !== 3) {
    throw new Error("center must contain exactly three coordinates");
  }
  for (let axis = 0; axis < 3; axis++) {
    const value = center[axis];
    const bound = axis === 0 ? options.dims.nx : axis === 1 ? options.dims.ny : options.dims.nz;
    if (!Number.isSafeInteger(value) || value < 0 || value >= bound) {
      throw new Error(`center[${axis}] must be an in-domain integer, got ${value}`);
    }
  }

  const seedRadius = options.seedRadius === undefined ? 2 : options.seedRadius;
  if (seedRadius !== null && (!Number.isSafeInteger(seedRadius) || seedRadius < 0)) {
    throw new Error(`seed radius must be a non-negative integer or null, got ${seedRadius}`);
  }
  const seedThickness = options.seedThickness ?? 1;
  if (!Number.isSafeInteger(seedThickness) || seedThickness < 1 || seedThickness % 2 === 0) {
    throw new Error(`seed thickness must be odd and >= 1, got ${seedThickness}`);
  }
  return center;
}

export class GGSolver implements SurfaceOperator {
  readonly dims: Dims;
  readonly params: GGParams;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly domain: DomainShape;
  readonly farField: FarFieldCondition;
  readonly center: readonly [number, number, number];
  tick = 0;
  /** Net mass injected (+) / removed (−) by the Dirichlet clamp, accumulated. 0 under reflecting. */
  dirichletMeter = 0;

  readonly a: Uint8Array;
  readonly b: Float64Array;
  readonly d: Float64Array;
  /** 1 = inert wall cell (outside the active domain). Never attaches, d = 0 forever. */
  readonly wall: Uint8Array;
  /** Cells whose mean d is the far-field level: active cells on the domain's outer shell. */
  readonly farFieldCells: Int32Array;
  /** Number of active (non-wall) cells. */
  readonly activeCellCount: number;
  /** hexPrism: inscribed hexagon radius and z half-extent; box: -1. */
  readonly hexRadius: number;
  readonly zHalfExtent: number;

  // blocked = wall OR attached: the reflecting rule treats both identically.
  private readonly blocked: Uint8Array;
  // Ping-pong scratch for the diffusion substeps.
  private readonly scratch1: Float64Array;
  private readonly scratch2: Float64Array;
  private noised: Float64Array | null = null; // (1 - xi) * d, allocated only when noise is on
  private xi: Float64Array | null = null;

  // Boundary bookkeeping: explicit list, never rediscovered by scanning (plan, Approach).
  private boundaryList: number[] = [];
  private readonly inBoundary: Uint8Array;
  // Attached-neighbor counts per cell, UNCAPPED, maintained incrementally on attachment.
  private readonly nTAtt: Uint8Array;
  private readonly nZAtt: Uint8Array;

  // Crystal lattice bounding box, maintained incrementally (O(1) guard checks).
  private iMin: number;
  private iMax: number;
  private jMin: number;
  private jMax: number;
  private kMin: number;
  private kMax: number;
  attachedCount = 0;
  /** The cells attached by the most recent step() — the incremental symmetry-gate input. */
  lastAttached: readonly number[] = [];

  constructor(options: GGSolverOptions) {
    const center = validateOptions(options);
    this.dims = options.dims;
    this.params = options.params;
    this.rngSeed = options.rngSeed;
    this.noiseEpsilon = options.noiseEpsilon ?? 0;
    this.domain = options.domain ?? "box";
    this.farField = options.farField ?? "reflecting";
    this.center = center;

    const { nx, ny, nz } = this.dims;
    const n = cellCount(this.dims);
    this.a = new Uint8Array(n);
    this.b = new Float64Array(n);
    this.d = new Float64Array(n);
    this.wall = new Uint8Array(n);
    this.blocked = new Uint8Array(n);
    this.scratch1 = new Float64Array(n);
    this.scratch2 = new Float64Array(n);
    this.inBoundary = new Uint8Array(n);
    this.nTAtt = new Uint8Array(n);
    this.nZAtt = new Uint8Array(n);

    const [ic, jc, kc] = this.center;
    const farField: number[] = [];
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
              this.d[x] = this.params.rho;
              if (dist === radius || Math.abs(k - kc) === halfZ) farField.push(x);
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
      this.d.fill(this.params.rho);
      this.activeCellCount = n;
      const pushed = new Uint8Array(n);
      const push = (x: number): void => {
        if (pushed[x] === 0) {
          pushed[x] = 1;
          farField.push(x);
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
    this.farFieldCells = Int32Array.from(farField);

    this.iMin = Infinity;
    this.iMax = -Infinity;
    this.jMin = Infinity;
    this.jMax = -Infinity;
    this.kMin = Infinity;
    this.kMax = -Infinity;

    const seedRadius = options.seedRadius === undefined ? 2 : options.seedRadius;
    if (seedRadius !== null) {
      const sites = hexSeedSites(
        this.dims,
        seedRadius,
        options.seedThickness ?? 1,
        this.center,
      );
      for (const site of sites) {
        if (this.wall[site] === 1) throw new Error("seed does not fit the active domain");
        this.attachCell(site, /*seedInit*/ true);
      }
      this.rebuildBoundaryList();
    }
  }

  /** a = 1, b = 1, d = 0 on the seed (gg-machinery §5); growth attachment folds d into b. */
  private attachCell(index: number, seedInit: boolean): void {
    if (this.a[index] === 1) return;
    this.a[index] = 1;
    this.blocked[index] = 1;
    if (seedInit) {
      this.b[index] = 1;
      this.d[index] = 0;
    } else {
      this.b[index] += this.d[index];
      this.d[index] = 0;
    }
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

    // Update neighbors' attached counts and grow the boundary set (walls never join it).
    this.forEachNeighbor(i, j, k, (nIndex, isZ) => {
      if (isZ) this.nZAtt[nIndex]++;
      else this.nTAtt[nIndex]++;
      if (this.blocked[nIndex] === 0 && this.inBoundary[nIndex] === 0) {
        this.inBoundary[nIndex] = 1;
        this.boundaryList.push(nIndex);
      }
    });
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

  private rebuildBoundaryList(): void {
    this.boundaryList = this.boundaryList.filter((index) => {
      if (this.a[index] === 1) {
        this.inBoundary[index] = 0;
        return false;
      }
      return true;
    });
  }

  /** One full tick: diffusion, freezing, attachment, melting. */
  step(): void {
    this.relaxField();
    this.advanceSurface();
    this.tick++;
  }

  /**
   * Step (i) as the SurfaceOperator sees it: exactly ONE published masked-average pass
   * (machinery fidelity — under GGThreshold the field is G-G's dynamics, not an elliptic
   * solve; attachment-kinetics §4.3). Under Dirichlet (2b) the far-field shell is then
   * clamped to rho, metered.
   */
  relaxField(): RelaxationReport {
    this.diffuse();
    let clampDelta = 0;
    if (this.farField === "dirichlet") {
      const rho = this.params.rho;
      for (let c = 0; c < this.farFieldCells.length; c++) {
        const x = this.farFieldCells[c];
        if (this.blocked[x] === 1) continue;
        clampDelta += rho - this.d[x];
        this.d[x] = rho;
      }
      this.dirichletMeter += clampDelta;
    }
    return {
      sweeps: 1,
      converged: true, // vacuously: one pass IS the published dynamics, not a solve
      residual: null,
      divergenceResidual: null,
      shellClampDiagnostic: this.farField === "dirichlet" ? clampDelta : null,
      absorptionDiagnostic: null,
    };
  }

  /** Steps (ii) freezing, (iii) attachment, (iv) melting — the surface exchange. */
  advanceSurface(): SurfaceReport {
    const boundary = this.boundaryList;
    const nBoundary = boundary.length;
    const { kappa, mu, ggThreshBeta } = this.params;

    // (ii) freezing on the boundary, start-of-tick counts (nTAtt/nZAtt are untouched until
    // the attachments are applied below).
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      const nT = this.nTAtt[x] < 3 ? this.nTAtt[x] : 3;
      const nZ = this.nZAtt[x] > 0 ? 1 : 0;
      const s = paramSlot(nT, nZ);
      const vapor = this.d[x];
      this.b[x] += (1 - kappa[s]) * vapor;
      this.d[x] = kappa[s] * vapor;
    }

    // (iii) attachment — GGThreshold, THE SEAM. Decide for every boundary cell from
    // start-of-tick counts, apply after (iv): deciding-all-then-applying-all makes
    // attachment simultaneous, and keeps (iv)'s kappa/mu lookups on start-of-tick counts
    // exactly as the spec requires.
    const toAttach: number[] = [];
    let holeFillCount = 0;
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      const rawNT = this.nTAtt[x];
      const rawNZ = this.nZAtt[x];
      if (rawNT >= 4 && rawNZ >= 1) {
        toAttach.push(x); // hole-filling rule, UNCAPPED n_T (gg-machinery §4.iii)
        holeFillCount++;
        continue;
      }
      const nT = rawNT < 3 ? rawNT : 3;
      const nZ = rawNZ > 0 ? 1 : 0;
      if (this.b[x] >= ggThreshBeta[paramSlot(nT, nZ)]) {
        toAttach.push(x);
      }
    }

    // (iv) melting — boundary cells that did NOT just attach (gg-machinery §4.iv:
    // freshly-attached cells are excluded; attached is a terminal state).
    const attachSet = new Set<number>(toAttach);
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      if (attachSet.has(x)) continue;
      const nT = this.nTAtt[x] < 3 ? this.nTAtt[x] : 3;
      const nZ = this.nZAtt[x] > 0 ? 1 : 0;
      const s = paramSlot(nT, nZ);
      const boundaryMass = this.b[x];
      this.b[x] = (1 - mu[s]) * boundaryMass;
      this.d[x] += mu[s] * boundaryMass;
    }

    // Apply attachments (a=1, b += d, d = 0) and update counts/boundary/bbox.
    for (const x of toAttach) this.attachCell(x, false);
    if (toAttach.length > 0) this.rebuildBoundaryList();
    this.lastAttached = toAttach;

    return {
      attachedNow: toAttach.length,
      maxKineticFillIncrement: null, // threshold rule: no fill kinetics, no CFL concept
      holeFillCount,
      deltaTimeSeconds: null, // a G-G tick is not physical time
      stalled: false,
      skippedUnconverged: false,
    };
  }

  /** The rule's exact evidence claim, measurably (SurfaceOperator; attachment-kinetics §4.4). */
  ledger(): LedgerReport {
    return {
      rule: "GGThreshold",
      claim:
        "Sigma(b+d) is exact under the reflecting far field (gg-machinery §4); under " +
        "Dirichlet the shell is a metered source/sink by design and the meter accounts " +
        "for the difference",
      totalMassBD: totalMass(this.b, this.d),
      dirichletMeter: this.farField === "dirichlet" ? this.dirichletMeter : null,
      fillLedgerIceCells: null,
      fillLedgerVaporUnits: null,
      holeFillDeficit: null,
      saturationClippedFill: null,
      lastDivergenceResidual: null,
    };
  }

  /**
   * Step (i). Composite operator D = (1b) o (1a) (plus (1c) when phi > 0), reflecting at
   * blocked (attached or wall) cells and at domain faces: a neighbor term pointing at a
   * blocked or out-of-domain cell is replaced by the CENTRE cell's own value of the
   * operator's input field. With noise on, the input field is (1 - xi) * d and xi * d is
   * added back after — gg-machinery §6, the reading under which mass conservation is exact.
   */
  private diffuse(): void {
    const { nx, ny, nz } = this.dims;
    const plane = nx * ny;
    const n = plane * nz;
    const blocked = this.blocked;
    const eps = this.noiseEpsilon;

    let input: Float64Array = this.d;
    if (eps > 0) {
      if (this.noised === null) {
        this.noised = new Float64Array(n);
        this.xi = new Float64Array(n);
      }
      const noised = this.noised;
      const xi = this.xi as Float64Array;
      const seed = this.rngSeed;
      const tick = this.tick;
      for (let x = 0; x < n; x++) {
        const e = eps * randomBit(seed, x, tick, STREAM_NOISE_XI);
        xi[x] = e;
        noised[x] = (1 - e) * this.d[x];
      }
      input = noised;
    }

    const out1 = this.scratch1;
    const out2 = this.scratch2;

    // (1a) in-plane: d'(x) = (1/7) * sum over {x} union N_T(x), reflecting. Canonical
    // summation: opposite-direction pairs, then the three pair-sums in sorted order (see
    // file header, determinism decision 2).
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      for (let j = 0; j < ny; j++) {
        const row = kBase + j * nx;
        const interiorJ = j >= 1 && j <= ny - 2;
        for (let i = 0; i < nx; i++) {
          const x = row + i;
          if (blocked[x] === 1) {
            out1[x] = 0;
            continue;
          }
          const own = input[x];
          let east: number, west: number, ne: number, sw: number, se: number, nw: number;
          if (interiorJ && i >= 1 && i <= nx - 2) {
            east = blocked[x + 1] === 1 ? own : input[x + 1];
            west = blocked[x - 1] === 1 ? own : input[x - 1];
            ne = blocked[x + nx] === 1 ? own : input[x + nx];
            sw = blocked[x - nx] === 1 ? own : input[x - nx];
            se = blocked[x + 1 - nx] === 1 ? own : input[x + 1 - nx];
            nw = blocked[x - 1 + nx] === 1 ? own : input[x - 1 + nx];
          } else {
            east = i + 1 < nx && blocked[x + 1] === 0 ? input[x + 1] : own;
            west = i - 1 >= 0 && blocked[x - 1] === 0 ? input[x - 1] : own;
            ne = j + 1 < ny && blocked[x + nx] === 0 ? input[x + nx] : own;
            sw = j - 1 >= 0 && blocked[x - nx] === 0 ? input[x - nx] : own;
            se = i + 1 < nx && j - 1 >= 0 && blocked[x + 1 - nx] === 0 ? input[x + 1 - nx] : own;
            nw = i - 1 >= 0 && j + 1 < ny && blocked[x - 1 + nx] === 0 ? input[x - 1 + nx] : own;
          }
          // Opposite pairs map to opposite pairs under all of rot60/mirror/zmirror;
          // within-pair addition is commutative, hence bitwise-symmetric.
          const p1 = east + west;
          const p2 = ne + sw;
          const p3 = se + nw;
          // Sort the three pair-sums so symmetric cells add in identical value order.
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

    // (1b) vertical: d''(x) = (4/7) d'(x) + (3/14) [d'(x+e3) + d'(x-e3)], reflecting.
    // up + down is commutative, hence zmirror-exact.
    for (let k = 0; k < nz; k++) {
      const kBase = k * plane;
      const hasUp = k + 1 < nz;
      const hasDown = k - 1 >= 0;
      for (let p = 0; p < plane; p++) {
        const x = kBase + p;
        if (blocked[x] === 1) {
          out2[x] = 0;
          continue;
        }
        const own = out1[x];
        const up = hasUp && blocked[x + plane] === 0 ? out1[x + plane] : own;
        const down = hasDown && blocked[x - plane] === 0 ? out1[x - plane] : own;
        out2[x] = (4 / 7) * own + (3 / 14) * (up + down);
      }
    }

    // (1c) drift, only when phi > 0 (all §8 presets have phi = 0):
    // d'''(x) = (1 - phi*(1 - a(x - e3))) d''(x) + phi*(1 - a(x + e3)) d''(x + e3),
    // out-of-domain/wall treated as attached (reflecting).
    const phi = this.params.phi;
    let result: Float64Array = out2;
    if (phi > 0) {
      const out3 = out1; // (1a) output is no longer needed; reuse as the (1c) buffer
      for (let k = 0; k < nz; k++) {
        const kBase = k * plane;
        const hasUp = k + 1 < nz;
        const hasDown = k - 1 >= 0;
        for (let p = 0; p < plane; p++) {
          const x = kBase + p;
          if (blocked[x] === 1) {
            out3[x] = 0;
            continue;
          }
          const freeBelow = hasDown && blocked[x - plane] === 0 ? 1 : 0;
          const freeAbove = hasUp && blocked[x + plane] === 0 ? 1 : 0;
          const inflow = freeAbove === 1 ? phi * out2[x + plane] : 0;
          out3[x] = (1 - phi * freeBelow) * out2[x] + inflow;
        }
      }
      result = out3;
    }

    // Commit into d; with noise on, add back the xi * d° refusal mass.
    const d = this.d;
    if (eps > 0) {
      const xi = this.xi as Float64Array;
      for (let x = 0; x < n; x++) {
        d[x] = blocked[x] === 1 ? 0 : result[x] + xi[x] * d[x];
      }
    } else {
      for (let x = 0; x < n; x++) {
        d[x] = blocked[x] === 1 ? 0 : result[x];
      }
    }
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

  /** Mean vapor over the far-field shell (free cells only), Neumaier-compensated. */
  farFieldMean(): number {
    let sum = 0;
    let compensation = 0;
    let count = 0;
    for (let c = 0; c < this.farFieldCells.length; c++) {
      const x = this.farFieldCells[c];
      if (this.a[x] === 1) continue;
      const value = this.d[x];
      const t = sum + value;
      if (Math.abs(sum) >= Math.abs(value)) {
        compensation += sum - t + value;
      } else {
        compensation += value - t + sum;
      }
      sum = t;
      count++;
    }
    if (count === 0) return Number.NaN;
    return (sum + compensation) / count;
  }

  boundarySize(): number {
    return this.boundaryList.length;
  }

  /** Read-only view of the boundary list (for observability dumps). */
  boundaryCells(): readonly number[] {
    return this.boundaryList;
  }

  /** Uncapped attached-neighbor counts (for observability dumps). */
  neighborCounts(index: number): [number, number] {
    return [this.nTAtt[index], this.nZAtt[index]];
  }

  state(): SolverState {
    return {
      dims: this.dims,
      tick: this.tick,
      rngSeed: this.rngSeed,
      noiseEpsilon: this.noiseEpsilon,
      farField: this.farField,
      domain: this.domain,
      params: this.params,
      a: this.a,
      b: this.b,
      d: this.d,
      center: this.center,
    };
  }
}
