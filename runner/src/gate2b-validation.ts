import type { RelaxationReport, SurfaceReport } from "@vcc/solver-cpu";

export const GATE2B_NODE = "v24.13.1";
export const GATE2B_V8 = "13.6.233.17-node.40";

export interface Gate2bProvenance {
  readonly node: string;
  readonly v8: string;
  readonly head: string;
  readonly trackedStatus: string;
  readonly preregistrationIsAncestor: boolean;
}

/** Fail closed before an hours-scale gate starts from an unregistered execution state. */
export function validateGate2bProvenance(provenance: Gate2bProvenance): void {
  if (provenance.node !== GATE2B_NODE || provenance.v8 !== GATE2B_V8) {
    throw new Error(
      `gate2b engine mismatch: expected Node ${GATE2B_NODE} / V8 ${GATE2B_V8}, got ` +
        `Node ${provenance.node} / V8 ${provenance.v8}`,
    );
  }
  if (!/^[0-9a-f]{40}$/.test(provenance.head)) {
    throw new Error(`gate2b could not identify an execution commit: ${provenance.head}`);
  }
  if (provenance.trackedStatus.trim() !== "") {
    throw new Error(
      "gate2b requires a tracked-clean execution commit; commit the implementation first",
    );
  }
  if (!provenance.preregistrationIsAncestor) {
    throw new Error("gate2b preregistration commit 8e0017a is not an ancestor of execution HEAD");
  }
}

export interface ValidatedLKStepEvidence {
  readonly divergenceResidual: number;
  readonly maxKineticFillIncrement: number;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
}

/**
 * Validate every load-bearing per-step report as a finite measurement. This deliberately
 * rejects null/NaN/infinity instead of allowing JavaScript comparisons or running maxima to
 * turn missing evidence into zero. The runner independently recomputes the divergence ratio
 * from the signed source/exchange totals rather than trusting the reported ratio alone.
 */
export function validateLKStepEvidence(
  relaxation: RelaxationReport,
  surface: SurfaceReport,
  relaxTol: number,
  divTol: number,
): ValidatedLKStepEvidence {
  if (
    !relaxation.converged ||
    !Number.isSafeInteger(relaxation.sweeps) ||
    relaxation.sweeps <= 0
  ) {
    throw new Error(
      `gate2b invalid relaxation completion: converged=${relaxation.converged}, ` +
        `sweeps=${String(relaxation.sweeps)}`,
    );
  }
  const residual = relaxation.residual;
  if (residual === null || !Number.isFinite(residual) || residual < 0 || !(residual < relaxTol)) {
    throw new Error(`gate2b invalid relaxation residual: ${String(residual)}`);
  }
  const shell = relaxation.shellClampDiagnostic;
  const exchange = relaxation.surfaceExchangeDiagnostic;
  if (shell === null || !Number.isFinite(shell) || !(shell > 0)) {
    throw new Error(`gate2b invalid far-shell injection: ${String(shell)}`);
  }
  if (exchange === null || !Number.isFinite(exchange) || !(exchange > 0)) {
    throw new Error(`gate2b invalid signed net surface exchange: ${String(exchange)}`);
  }
  const reportedDivergence = relaxation.divergenceResidual;
  if (
    reportedDivergence === null ||
    !Number.isFinite(reportedDivergence) ||
    reportedDivergence < 0
  ) {
    throw new Error(`gate2b invalid divergence residual: ${String(reportedDivergence)}`);
  }
  const recomputedDivergence = Math.abs(shell - exchange) / Math.max(Math.abs(exchange), 1e-300);
  const agreementScale = Math.max(1, reportedDivergence, recomputedDivergence);
  if (
    !Number.isFinite(recomputedDivergence) ||
    Math.abs(reportedDivergence - recomputedDivergence) > 8 * Number.EPSILON * agreementScale
  ) {
    throw new Error(
      `gate2b divergence report mismatch: reported ${reportedDivergence}, ` +
        `recomputed ${recomputedDivergence}`,
    );
  }
  if (!(recomputedDivergence < divTol)) {
    throw new Error(
      `gate2b divergence residual ${recomputedDivergence} did not satisfy divTol ${divTol}`,
    );
  }
  const kinetic = surface.maxKineticFillIncrement;
  if (kinetic === null || !Number.isFinite(kinetic) || !(kinetic > 0)) {
    throw new Error(`gate2b invalid kinetic fill increment: ${String(kinetic)}`);
  }
  const deltaTime = surface.deltaTimeSeconds;
  if (deltaTime === null || !Number.isFinite(deltaTime) || !(deltaTime > 0)) {
    throw new Error(`gate2b invalid interface timestep: ${String(deltaTime)}`);
  }
  if (surface.stalled || surface.skippedUnconverged) {
    throw new Error(
      `gate2b invalid surface report: stalled=${surface.stalled}, ` +
        `skippedUnconverged=${surface.skippedUnconverged}`,
    );
  }
  return {
    divergenceResidual: recomputedDivergence,
    maxKineticFillIncrement: kinetic,
    shellInjection: shell,
    surfaceExchange: exchange,
  };
}
