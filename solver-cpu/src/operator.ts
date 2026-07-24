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
  /** GGThreshold: vacuously true (one pass IS its dynamics). LK+Dirichlet: the DUAL
      criterion — residual < relaxTol AND divergenceResidual < divTol. Reflecting LK is a
      residual-only diagnostic with no divergence claim. */
  readonly converged: boolean;
  /** Relative per-sweep max change at exit; null under GGThreshold (no residual concept). */
  readonly residual: number | null;
  /** Policy-versioned global balance divided by |net surface exchange|; null under GGThreshold
      and reflecting LK. Legacy-v3 and aggregate-v4 use |shell clamp − exchange|. Aggregate-v5
      uses |shell clamp + directly metered float64 smoother drift − exchange| (ADR 0013).
      Local exchange and smoother drift are numerical potential diagnostics, not uptake. */
  readonly divergenceResidual: number | null;
  /**
   * Shell-clamp total for the LAST sweep (LK) or this tick's Dirichlet meter delta (GG).
   * NUMERICAL DIAGNOSTIC ONLY under LK: relaxation sweeps carry no physical time (charter:
   * physical time enters only through the interface update), so clamp totals must never be
   * integrated into a physical mass claim. The interface-update ledger instead states
   * exact bookkeeping for computed kinetic demand, placed fill, and unapplied clipping.
   */
  readonly shellClampDiagnostic: number | null;
  /** Signed net numerical surface-boundary exchange for the last sweep; null under
      GGThreshold. Legacy-v3's value is its nonnegative Robin absorption total. This is a
      relaxation diagnostic, never deposited fill or physical uptake. */
  readonly surfaceExchangeDiagnostic: number | null;
  /** Aggregate-v5 only: signed active-field change produced by the reflecting smoother before
      boundary replacement and Dirichlet clamp. Directly metered in the same sweep; never
      inferred from other report terms, and rejected if it exceeds decision 0014's independent
      float64 roundoff bound. Null for GG, legacy-v3, and aggregate-v4. */
  readonly smootherDriftDiagnostic: number | null;
  /** Minimum local boundary-replacement exchange in the last aggregate-v4/v5 sweep. It may be
      negative because tangential potential redistribution is signed. Null under GGThreshold
      and policies without an aggregate boundary replacement. */
  readonly minLocalSurfaceExchangeDiagnostic: number | null;
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
  /** The rule-specific exact evidence claim, in one sentence, measurably. */
  readonly claim: string;
  /** GGThreshold: Σ(b+d) (Neumaier) — the exact reflecting-boundary invariant. Null for LK. */
  readonly totalMassBD: number | null;
  /** GGThreshold+Dirichlet: accumulated metered source. Null for LK (see shellClampDiagnostic). */
  readonly dirichletMeter: number | null;
  /** LK: kinetic fill actually PLACED, ice-cell units. It is the deposited part of the
      computed demand; fillLedgerIceCells + saturationClippedFill equals the computed
      selected surface policy's Hertz-Knudsen kinetic demand exactly (§4.4 component 4):
      per boundary pixel under aggregate v4, per contact under legacy v3. The clipping term is
      recorded UNAPPLIED numerical excess, not deposited ice or physical uptake. Null for GG. */
  readonly fillLedgerIceCells: number | null;
  /** LK: the PLACED fill in vapor-ledger units. Fixed-temperature runs equal
      fillLedgerIceCells · M_ice(T); timeline histories sum each interface step's placed-fill
      delta at that step's M_ice. This is bookkeeping, not a conserved vapor-pool claim.
      Null for GG. */
  readonly fillLedgerVaporUnits: number | null;
  /** LK: fill granted by hole-filling without vapor withdrawal — reported, never hidden. */
  readonly holeFillDeficit: number | null;
  /** LK: computed Hertz-Knudsen demand left UNAPPLIED when a cell saturated (f hit 1
      mid-increment) — recorded numerical excess, bounded per cell per step by the fill-CFL
      (round-3 maker review: silently dropping it broke the bookkeeping identity by 35% on
      saturating steps). */
  readonly saturationClippedFill: number | null;
  /** LK+Dirichlet: latest divergence residual. Null for GG and reflecting LK. */
  readonly lastDivergenceResidual: number | null;
}

export interface SurfaceOperator {
  readonly tick: number;
  relaxField(): RelaxationReport;
  advanceSurface(): SurfaceReport;
  ledger(): LedgerReport;
}
