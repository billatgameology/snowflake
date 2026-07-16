// LibbrechtKinetics — the surface operator of attachment-kinetics §4.4, implemented.
//
// One growth step (§4.4 "the operator in one paragraph", as corrected through audit round 3;
// header synced round-4 — it had kept the pre-correction formulas):
//   1. relaxField(): iterate the Phase 2a smoother kernel (canonical pair summation) with the
//      Robin partial-reflection substitution at attached faces and the Dirichlet far-field
//      shell clamped to sigma_infinity, until BOTH the iterate residual (relaxTol) AND the
//      divergence identity (divTol) are satisfied — the dual criterion IS convergence. The
//      attachment coefficient is re-evaluated from the current field each sweep (Picard),
//      so the converged field solves the nonlinear Robin problem self-consistently.
//   2. advanceSurface(): classify each boundary cell from START-OF-STEP attached counts,
//      solve the same self-consistent (alphaHK, sigma_face) pair the sink used, fill PER
//      ATTACHED FACE with the hexagonal-prism geometry factors — per-cell rate =
//      [(2/3) nT + nZ] * alphaHK * vKin * sigma_face / dx, adaptive dt = cfl / max(rate),
//      f += min(rate * dt, 1 - f) with the truncated excess RECORDED in
//      saturationClippedFill — attach at f = 1 (simultaneous) plus the kept hole-filling
//      rule.
//
// Dispositions (§4.4 component 5): no kappa freezing (the Robin substitution is the only
// vapor uptake), no melting (the kinetic rate is clamped at 0 from below), hole-filling
// kept, noise is a per-cell multiplicative alphaHK slowdown applied identically in the sink
// and the growth (own PRNG stream), drift phi unsupported.
//
// Conservation claims (§4.4 components 3-4): the field is a quasi-static POTENTIAL, not a
// mass store — the meaningful checks are (a) the discrete divergence identity, REQUIRED for
// convergence (per-sweep Dirichlet injection equals per-sweep Robin absorption, since the
// interior smoother conserves), and (b) the flux identity: fillLedger + saturationClippedFill
// integrates exactly the per-face Hertz-Knudsen flux (hole-filled cells' unearned remainder
// is reported as holeFillDeficit, never hidden). Environment-neutral: no Node APIs
// (charter §3.1).

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
  /** Fill-CFL bound on the max PER-CELL kinetic fill increment — the per-face sum
      [(2/3)·nT + nZ]·alphaHK·vKin·sigma_face·dt/dx (§4.4 test 5 as amended; round-5 review:
      this doc said "max(v_n)·dt/dx" until then, predating the face factors). */
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
  /** alphaHK slowdown amplitude — applied identically in the relaxation's Robin sink and
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
  readonly divTol: number;
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
  /** Face-factor-weighted fill velocity max(rate)·dx (m/s) of the most recent
      advanceSurface — NOT a bare v_n: the rate includes [(2/3)·nT + nZ] (round-5 review:
      the old name lastMaxVn misdocumented the stored quantity). Observability only. */
  lastMaxFillVelocityMS = 0;
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
  /** Hertz-Knudsen flux clipped at saturating cells (f hit 1 mid-increment) — recorded
      discretization loss, round-3 review blocker 2. Bounded per cell/step by the CFL. */
  saturationClippedFill = 0;
  lastRelaxation: RelaxationReport | null = null;
  /** Set by a CONVERGED relaxField for this tick; consumed by advanceSurface (round-3
      review: the public interface must not be able to bypass the unconverged guard). */
  private surfaceReady = false;

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
    this.divTol = options.divTol ?? 1e-6;
    if (!(this.sigmaInfinity > 0)) throw new Error("sigmaInfinity must be > 0 (Dirichlet held)");
    // Drift is unsupported STRUCTURALLY and at runtime (round-3 review: TypeScript's type
    // check does not bind JS callers; §4.4 component 5 promises rejection, so reject).
    if ("phi" in options) {
      throw new Error("drift phi is unsupported under LibbrechtKinetics (attachment-kinetics §4.4)");
    }

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

  /**
   * alphaHK of a boundary cell given a sigma_surf value (facet class from current counts).
   * NOISE IS FOLDED IN HERE (round-3 review: the sink and the growth must see the same
   * perturbed coefficient — noising only v_n silently broke the coupling): with epsilon on,
   * the cell's coefficient is multiplied by (1 − xi) for the CURRENT tick, deterministically
   * from the counter PRNG, in both the relaxation's Robin factor and the interface update.
   */
  private cellAlphaHK(index: number, sigmaSurf: number): number {
    const facet = this.facetClassOf(index);
    let a =
      this.testAlphaOverride !== undefined
        ? this.testAlphaOverride(facet, this.tempC, sigmaSurf)
        : alphaHK(facet, this.tempC, sigmaSurf, this.paramSet);
    if (this.noiseEpsilon > 0) {
      a *= 1 - this.noiseEpsilon * randomBit(this.rngSeed, index, this.tick, STREAM_NOISE_VN);
    }
    return a;
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
    let divergence = Infinity;
    while (sweeps < this.relaxMaxSweeps) {
      const [maxAbs, inj, abs] = this.sweep(src, dst);
      sweeps++;
      residual = maxAbs / this.sigmaInfinity;
      injection = inj;
      absorption = abs;
      divergence =
        this.farField === "dirichlet"
          ? Math.abs(inj - abs) / Math.max(Math.abs(abs), 1e-300)
          : 0;
      const tmp = src;
      src = dst;
      dst = tmp;
      // Convergence requires BOTH the iterate-change residual AND the divergence identity
      // (round-3 review: the identity IS the definition of a converged quasi-static solve;
      // iterate change alone reported "converged" fields whose imbalance grew with domain).
      if (residual < this.relaxTol && divergence < this.divTol) break;
    }
    if (src !== this.sigma) this.sigma.set(src);
    const converged = residual < this.relaxTol && divergence < this.divTol;
    this.surfaceReady = converged;
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
   * §4.4 steps 2-5: classify, v_n, fill, attach (simultaneous), ledger. Uses the SAME
   * self-consistent (alphaHK, sigma_face) as the relaxation's Robin sink, and fills
   * PER ATTACHED FACE with the hexagonal-prism geometry factors (round-3 review, blocker 1a:
   * across-flats = height = Δx makes the cell volume (√3/2)·Δx³; a basal face advancing at
   * v_n fills it in Δx/v_n, a prism face — area (1/√3)·Δx² — in (3/2)·Δx/v_n, so a lateral
   * face contributes (2/3)·v_n·Δt/Δx and a vertical face v_n·Δt/Δx, summed over the cell's
   * attached faces). The fill-CFL bounds the resulting PER-CELL rate, so max Δf = cfl
   * exactly. Throws if called without a converged relaxation for this tick.
   */
  advanceSurface(): SurfaceReport {
    if (!this.surfaceReady) {
      throw new Error(
        "advanceSurface without a converged relaxField for this step — growing on an " +
          "unconverged field is a silent physics error (attachment-kinetics §4.4)",
      );
    }
    this.surfaceReady = false;
    const boundary = this.boundaryList;
    const nBoundary = boundary.length;
    const rateArr = new Float64Array(nBoundary); // per-cell fill rate, units of v/dx
    let maxRate = 0;
    for (let bi = 0; bi < nBoundary; bi++) {
      const x = boundary[bi];
      const face = this.solveFace(x, this.sigma[x]);
      const vn = face.alphaHKFace * this.vKinMS * face.sigmaFace;
      const faceFactor = (2 / 3) * this.nTAtt[x] + this.nZAtt[x];
      const rate = (faceFactor * vn) / this.dxM; // fill fraction per second
      rateArr[bi] = rate;
      if (rate > maxRate) maxRate = rate;
    }
    this.lastMaxFillVelocityMS = maxRate * this.dxM;

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

    return {
      attachedNow: toAttach.length,
      maxKineticFillIncrement,
      holeFillCount,
      deltaTimeSeconds: deltaTime,
      stalled: maxRate <= 0,
      skippedUnconverged: false,
    };
  }

  /** The rule's conservation claim, measurably (§4.4 component 6; SurfaceOperator). */
  ledger(): LedgerReport {
    return {
      rule: "LibbrechtKinetics",
      claim:
        "the fill ledger plus recorded saturation clipping integrates exactly the per-face " +
        "Hertz-Knudsen flux the solver computed (one sigma_face, hexagonal-prism face " +
        "factors 2/3 lateral / 1 vertical); solve quality is the divergence identity, " +
        "required for convergence; the field is a quasi-static potential — no Sigma(b+d) " +
        "claim exists under this rule",
      totalMassBD: null,
      dirichletMeter: null,
      fillLedgerIceCells: this.fillLedger,
      fillLedgerVaporUnits: this.fillLedger * this.mIceLedger,
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
