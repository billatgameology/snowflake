// LibbrechtKinetics — the surface operator of attachment-kinetics §4.4, implemented.
//
// One growth step (§4.4 "the operator in one paragraph"):
//   1. relaxField(): iterate the Phase 2a smoother kernel (canonical pair summation) to a
//      stated residual tolerance, with the Robin partial-reflection substitution at attached
//      faces and the Dirichlet far-field shell clamped to sigma_infinity (metered). The
//      attachment coefficient is re-evaluated from the current field each sweep (Picard),
//      so the converged field solves the nonlinear Robin problem self-consistently.
//   2. advanceSurface(): classify each boundary cell from START-OF-STEP attached counts,
//      v_n = alphaHK * v_kin * sigma_surf from the CONVERGED field, adaptive
//      dt = cfl * dx / max(v_n), fill f += min(v_n dt/dx, 1 - f), attach at f = 1
//      (simultaneous) plus the kept hole-filling rule.
//
// Dispositions (§4.4 component 5): no kappa freezing (the Robin substitution is the only
// vapor uptake), no melting (v_n clamped at 0 from below), hole-filling kept, noise is a
// per-cell multiplicative v_n slowdown (own PRNG stream), drift phi unsupported.
//
// Conservation claims (§4.4 components 3-4): the field is a quasi-static POTENTIAL, not a
// mass store — the meaningful checks are (a) the discrete divergence identity at convergence
// (per-sweep Dirichlet injection equals per-sweep Robin absorption, exact up to float, since
// the interior smoother conserves), and (b) the fill ledger (ice gained = sum of fill
// increments; hole-filled cells' unearned remainder is reported as holeFillDeficit, never
// hidden). Environment-neutral: no Node APIs (charter §3.1).

import {
  alphaHK,
  cellCount,
  classifyFacet,
  domainCenter,
  hexDistance,
  hexSeedSites,
  kineticLength,
  mIce,
  randomBit,
  vKin,
  DOMAIN_CONTACT_FRACTION,
  STREAM_NOISE_VN,
  type Dims,
  type DomainShape,
  type FacetClass,
  type FarFieldCondition,
  type NucleationParamSet,
} from "@vcc/core";
import type { LedgerReport, RelaxationReport, SurfaceOperator, SurfaceReport } from "./operator.ts";

export interface LKSolverOptions {
  readonly dims: Dims;
  /** Temperature, °C. Must keep (Tm − T) inside the digitized domain [1, 50]. */
  readonly tempC: number;
  /** Far-field supersaturation (dimensionless fraction), held at the Dirichlet shell. */
  readonly sigmaInfinity: number;
  /** Lattice spacing, microns (P4 run input). */
  readonly dxUm: number;
  readonly pressurePa?: number; // default 1 atm
  readonly paramSet?: NucleationParamSet; // default "CAK_A1" (see libbrecht.ts)
  /** Fill-CFL bound on max(v_n)·dt/dx per growth step (§4.4 test 5). */
  readonly cflFill?: number; // default 0.1
  /** Relaxation: per-sweep max |change| / sigmaInfinity below this = converged. */
  readonly relaxTol?: number; // default 1e-9
  readonly relaxMaxSweeps?: number; // default 200_000
  readonly rngSeed: number;
  /** v_n slowdown amplitude; 0 (default) = off. P4 dial (§4.4 component 5). */
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
   * TEST-ONLY hook replacing alphaHK, for the §4.4 component-6 Robin-limit tests (alphaHK ≡ 0
   * must recover the reflecting pass exactly; alphaHK ≡ 1 must absorb). Never set in runs —
   * the runner does not expose it.
   */
  readonly testAlphaOverride?: (facet: FacetClass, tempC: number, sigmaSurf: number) => number;
  /**
   * TEST-ONLY: extra cell indices attached at init (after the hex seed), for constructing
   * exact boundary geometries (e.g. the hole-fill probe). Never set in runs.
   */
  readonly testExtraSeedSites?: readonly number[];
}

export class LKSolver implements SurfaceOperator {
  readonly dims: Dims;
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxM: number;
  readonly pressurePa: number;
  readonly paramSet: NucleationParamSet;
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly relaxMaxSweeps: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly domain: DomainShape;
  readonly farField: FarFieldCondition;
  readonly center: readonly [number, number, number];

  /** Derived physics for this run (libbrecht-parameters.md forms). */
  readonly vKinMS: number;
  readonly x0M: number;
  readonly mIceLedger: number;
  /** max v_n of the most recent advanceSurface (for observability). */
  lastMaxVn = 0;
  holeFillCountTotal = 0;

  tick = 0; // growth steps taken
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
  /** Robin absorption factor s_eff per boundary cell, recomputed each sweep (Picard). */
  private readonly sEff: Float64Array;

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
  lastRelaxation: RelaxationReport | null = null;

  constructor(options: LKSolverOptions) {
    this.dims = options.dims;
    this.tempC = options.tempC;
    this.sigmaInfinity = options.sigmaInfinity;
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
    if (!(this.sigmaInfinity > 0)) throw new Error("sigmaInfinity must be > 0 (Dirichlet held)");

    this.vKinMS = vKin(this.tempC);
    this.x0M = kineticLength(this.tempC, this.pressurePa);
    this.mIceLedger = mIce(this.tempC);

    const { nx, ny, nz } = this.dims;
    const n = cellCount(this.dims);
    this.a = new Uint8Array(n);
    this.f = new Float64Array(n);
    this.sigma = new Float64Array(n);
    this.wall = new Uint8Array(n);
    this.blocked = new Uint8Array(n);
    this.scratch1 = new Float64Array(n);
    this.scratch2 = new Float64Array(n);
    this.sEff = new Float64Array(n);
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
        if (this.wall[site] === 1) throw new Error("extra seed site is a wall cell");
        this.attachCell(site);
      }
      this.rebuildBoundaryList();
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
    return classifyFacet(this.nTAtt[index], this.nZAtt[index]);
  }

  /** alphaHK of a boundary cell given a sigma_surf value (facet class from current counts). */
  private cellAlphaHK(index: number, sigmaSurf: number): number {
    const facet = this.facetClassOf(index);
    if (this.testAlphaOverride !== undefined) {
      return this.testAlphaOverride(facet, this.tempC, sigmaSurf);
    }
    return alphaHK(facet, this.tempC, sigmaSurf, this.paramSet);
  }

  /**
   * Self-consistent surface values at a boundary cell (§4.4 component 3 as CORRECTED after
   * the round-2 maker review): the discrete Robin substitution implies a surface value
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
    return { alphaHKFace, sEff: s / (1 + s), sigmaFace: sigmaCell / (1 + s) };
  }

  /** Recompute the Robin factor per boundary cell from the CURRENT field (Picard). */
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
  private sweep(src: Float64Array, dst: Float64Array): [number, number, number] {
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
          const term = (ni: number, nj: number, off: number): number => {
            if (ni < 0 || ni >= nx || nj < 0 || nj >= ny) return own; // domain face: reflect
            const nIdx = x + off;
            if (blocked[nIdx] === 0) return src[nIdx];
            if (wall[nIdx] === 1) return own; // inert wall: reflect (never absorbs)
            absorption += (own - robin) / 7; // attached face: Robin sink
            return robin;
          };
          const east = term(i + 1, j, 1);
          const west = term(i - 1, j, -1);
          const ne = term(i, j + 1, nx);
          const sw = term(i, j - 1, -nx);
          const se = term(i + 1, j - 1, 1 - nx);
          const nw = term(i - 1, j + 1, -1 + nx);
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
    return [maxAbs, injection, absorption];
  }

  /** §4.4 step 1: relax to tolerance; measure the divergence identity at convergence. */
  relaxField(): RelaxationReport {
    let src = this.sigma;
    let dst = this.scratch2;
    let sweeps = 0;
    let residual = Infinity;
    let injection = 0;
    let absorption = 0;
    while (sweeps < this.relaxMaxSweeps) {
      const [maxAbs, inj, abs] = this.sweep(src, dst);
      sweeps++;
      residual = maxAbs / this.sigmaInfinity;
      injection = inj;
      absorption = abs;
      const tmp = src;
      src = dst;
      dst = tmp;
      if (residual < this.relaxTol) break;
    }
    if (src !== this.sigma) this.sigma.set(src);
    const converged = residual < this.relaxTol;
    const scale = Math.max(Math.abs(absorption), 1e-300);
    const report: RelaxationReport = {
      sweeps,
      residual,
      converged,
      // The divergence identity is only defined against the Dirichlet source; in the
      // reflecting diagnostic mode there is no source and the identity is not a claim.
      divergenceResidual:
        this.farField === "dirichlet" ? Math.abs(injection - absorption) / scale : null,
      shellClampDiagnostic: this.farField === "dirichlet" ? injection : null,
      absorptionDiagnostic: absorption,
    };
    this.lastRelaxation = report;
    return report;
  }

  /**
   * §4.4 steps 2-5: classify, v_n, fill, attach (simultaneous), ledger. v_n uses the SAME
   * self-consistent sigma_face as the relaxation's Robin sink (§4.4 component 3 corrected) —
   * the physical vapor uptake and the ice gain are one number by construction.
   */
  advanceSurface(): SurfaceReport {
    const boundary = this.boundaryList;
    const nBoundary = boundary.length;
    const vnArr = new Float64Array(nBoundary);
    let maxVn = 0;
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      const face = this.solveFace(x, this.sigma[x]);
      let vn = face.alphaHKFace * this.vKinMS * face.sigmaFace;
      if (this.noiseEpsilon > 0) {
        vn *= 1 - this.noiseEpsilon * randomBit(this.rngSeed, x, this.tick, STREAM_NOISE_VN);
      }
      vnArr[bi] = vn;
      if (vn > maxVn) maxVn = vn;
    }
    this.lastMaxVn = maxVn;

    const toAttach: number[] = [];
    let maxKineticFillIncrement = 0;
    let deltaTime = 0;
    if (maxVn > 0) {
      deltaTime = (this.cflFill * this.dxM) / maxVn;
      for (let bi = 0; bi < nBoundary; bi++) {
        const x = boundary[bi];
        const raw = (vnArr[bi] * deltaTime) / this.dxM;
        const room = 1 - this.f[x];
        if (raw >= room) {
          this.fillLedger += room;
          this.f[x] = 1;
          toAttach.push(x);
          if (room > maxKineticFillIncrement) maxKineticFillIncrement = room;
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

    return {
      attachedNow: toAttach.length,
      maxKineticFillIncrement,
      holeFillCount,
      deltaTimeSeconds: deltaTime,
      stalled: maxVn <= 0,
      skippedUnconverged: false,
    };
  }

  /** The rule's conservation claim, measurably (§4.4 component 6; SurfaceOperator). */
  ledger(): LedgerReport {
    return {
      rule: "LibbrechtKinetics",
      claim:
        "vapor uptake ≡ ice gain by construction (one sigma_face feeds both the Robin sink " +
        "and v_n); solve self-consistency is the divergence identity; the field is a " +
        "quasi-static potential — no Sigma(b+d) claim exists under this rule",
      totalMassBD: null,
      dirichletMeter: null,
      fillLedgerIceCells: this.fillLedger,
      fillLedgerVaporUnits: this.fillLedger * this.mIceLedger,
      holeFillDeficit: this.holeFillDeficit,
      lastDivergenceResidual: this.lastRelaxation?.divergenceResidual ?? null,
    };
  }

  /**
   * One full growth step. If the relaxation did NOT converge, the surface is NOT advanced
   * (round-2 maker review: growing on an unconverged field is a silent physics error) —
   * the caller sees converged=false and skippedUnconverged=true and must stop or re-relax.
   */
  step(): { relaxation: RelaxationReport; surface: SurfaceReport } {
    const relaxation = this.relaxField();
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
    this.tick++;
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
}
