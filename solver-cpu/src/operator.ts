// The SurfaceOperator interface — attachment-kinetics §4.4 component 6, as one COMMON
// contract both rules implement (round-2 maker review: the first implementation shipped two
// unrelated report shapes and no ledger() at all; this file is the shared seam).
//
// GGThreshold (GGSolver) and LibbrechtKinetics (LKSolver) both satisfy this interface; the
// conformance test in solver-cpu/test/operator.test.ts holds them to it at compile time and
// exercises the ledgers at run time. The two solvers deliberately do NOT share mutable
// machinery code — the control-group differential (charter §3.3) is worth the duplication —
// but they speak the same operator language.

export interface RelaxationReport {
  /** GGThreshold: always 1 (the published single pass). LibbrechtKinetics: sweeps to tol. */
  readonly sweeps: number;
  /** GGThreshold: vacuously true (one pass IS its dynamics). LK: the DUAL criterion —
      residual < relaxTol AND divergenceResidual < divTol (round-3: iterate change alone
      passed fields whose shell-vs-sink imbalance grew with domain size; round-4 review
      caught this comment still stating residual-only). */
  readonly converged: boolean;
  /** Relative per-sweep max change at exit; null under GGThreshold (no residual concept). */
  readonly residual: number | null;
  /** |shell clamp − Robin absorption| / absorption at convergence; null under GGThreshold. */
  readonly divergenceResidual: number | null;
  /**
   * Shell-clamp total for the LAST sweep (LK) or this tick's Dirichlet meter delta (GG).
   * NUMERICAL DIAGNOSTIC ONLY under LK: relaxation sweeps carry no physical time (charter:
   * physical time enters only through the interface update), so clamp totals must never be
   * integrated into a physical mass claim. The physical uptake statement lives in the
   * ledger, via the interface update.
   */
  readonly shellClampDiagnostic: number | null;
  /** Robin absorption total for the last sweep; null under GGThreshold. */
  readonly absorptionDiagnostic: number | null;
}

export interface SurfaceReport {
  /** Cells attached by this surface step. */
  readonly attachedNow: number;
  /** Max KINETIC fill increment this step (fill-CFL subject); null under GGThreshold. */
  readonly maxKineticFillIncrement: number | null;
  /** Hole-filling attachments this step (geometric hygiene — NOT fill-CFL subject; their
      unearned fill is the ledger's holeFillDeficit). Tracked under both rules. */
  readonly holeFillCount: number;
  /** Physical time advanced; null under GGThreshold (its tick is not physical time). */
  readonly deltaTimeSeconds: number | null;
  /** LK: no site had v_n > 0. Always false under GGThreshold. */
  readonly stalled: boolean;
  /** Surface step skipped because the field relaxation did not converge (LK only). */
  readonly skippedUnconverged: boolean;
}

export interface LedgerReport {
  readonly rule: "GGThreshold" | "LibbrechtKinetics";
  /** The conservation claim this rule makes, in one sentence, measurably. */
  readonly claim: string;
  /** GGThreshold: Σ(b+d) (Neumaier) — the exact reflecting-boundary invariant. Null for LK. */
  readonly totalMassBD: number | null;
  /** GGThreshold+Dirichlet: accumulated metered source. Null for LK (see shellClampDiagnostic). */
  readonly dirichletMeter: number | null;
  /** LK: kinetic fill actually PLACED, ice-cell units. NOT alone the physical uptake:
      uptake = fillLedgerIceCells + saturationClippedFill — the per-face Hertz-Knudsen flux
      integral, exact (§4.4 component 4 as re-corrected round-3; round-4 review caught this
      comment still equating fill alone with uptake, which understates it on saturating
      steps). Null for GG. */
  readonly fillLedgerIceCells: number | null;
  /** LK: the PLACED fill in vapor-ledger units, fillLedger · M_ice(T). Null for GG. */
  readonly fillLedgerVaporUnits: number | null;
  /** LK: fill granted by hole-filling without vapor withdrawal — reported, never hidden. */
  readonly holeFillDeficit: number | null;
  /** LK: Hertz-Knudsen flux clipped when a cell saturated (f hit 1 mid-increment) — a
      recorded discretization loss, bounded per cell per step by the fill-CFL (round-3 maker
      review: silently dropping it broke the flux identity by 35% on saturating steps). */
  readonly saturationClippedFill: number | null;
  /** LK: divergence residual of the most recent converged relaxation. Null for GG. */
  readonly lastDivergenceResidual: number | null;
}

export interface SurfaceOperator {
  readonly tick: number;
  relaxField(): RelaxationReport;
  advanceSurface(): SurfaceReport;
  ledger(): LedgerReport;
}
