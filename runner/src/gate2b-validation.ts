import { metersSmootherDrift, type LKSurfacePolicy } from "@vcc/core";
import type { RelaxationReport, SurfaceReport } from "@vcc/solver-cpu";

export const GATE2B_NODE = "v24.13.1";
export const GATE2B_V8 = "13.6.233.17-node.40";
export const GATE2B_PREREGISTRATION = "8adea86ef3fcf8f6ba8ea5a3764e56de6d193f49";

export type Gate2bRole = "plate" | "column";

export interface Gate2bWorkerSpec {
  readonly role: Gate2bRole;
  readonly label: "plate(-5C)" | "column(-15C)";
  readonly tempC: -5 | -15;
  readonly checkpointPath: "out/gate2b-v5p-plate.ckpt" | "out/gate2b-v5p-column.ckpt";
}

export const GATE2B_WORKER_SPECS: Readonly<Record<Gate2bRole, Gate2bWorkerSpec>> = {
  plate: {
    role: "plate",
    label: "plate(-5C)",
    tempC: -5,
    checkpointPath: "out/gate2b-v5p-plate.ckpt",
  },
  column: {
    role: "column",
    label: "column(-15C)",
    tempC: -15,
    checkpointPath: "out/gate2b-v5p-column.ckpt",
  },
};

export interface LKRunResult {
  readonly surfacePolicy: LKSurfacePolicy;
  readonly stopReason: "size-target" | "domain-contact" | "step-cap" | "stalled" | "unconverged";
  readonly aspectRatio: number;
  readonly attached: number;
  readonly seedSites: number;
  readonly tick: number;
  readonly extent: number;
  readonly symmetryClean: boolean;
  readonly finalSymErr: number;
  readonly allConverged: boolean;
  readonly minShellInjection: number;
  readonly minSurfaceExchange: number;
  readonly worstDivergence: number;
  readonly maxAbsSmootherDrift: number | null;
  readonly smootherDriftAbsLimit: number | null;
  readonly maxKineticFillEver: number;
  readonly holeFillCountTotal: number;
  readonly pecletBound: number;
  readonly simTimeSeconds: number;
}

export interface Gate2bWorkerEnvelope {
  readonly kind: "gate2b-v5p-result";
  readonly role: Gate2bRole;
  readonly tempC: -5 | -15;
  readonly checkpointPath: string;
  readonly result: LKRunResult;
}

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
    throw new Error(
      `gate2b preregistration commit ${GATE2B_PREREGISTRATION} is not an ancestor of execution HEAD`,
    );
  }
}

export interface ValidatedLKStepEvidence {
  readonly divergenceResidual: number;
  readonly maxKineticFillIncrement: number;
  readonly shellInjection: number;
  readonly surfaceExchange: number;
  readonly smootherDrift: number | null;
  readonly smootherDriftAbsLimit: number | null;
}

/** Refuse stale/overwrite-prone final paths before either evidence worker starts. */
export function validateGate2bOutputAbsence(existingPaths: readonly string[]): void {
  if (existingPaths.length > 0) {
    throw new Error(`gate2b v5p output paths must be absent before launch: ${existingPaths.join(", ")}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireFiniteResultNumber(
  record: Record<string, unknown>,
  key: keyof LKRunResult,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`gate2b worker result ${String(key)} must be finite, got ${String(value)}`);
  }
  return value;
}

/** Authenticate one child's terminal IPC/exit tuple before it can enter the aggregate gate. */
export function validateGate2bWorkerCompletion(
  expected: Gate2bWorkerSpec,
  messages: readonly unknown[],
  exitCode: number | null,
  signal: NodeJS.Signals | null,
): Gate2bWorkerEnvelope {
  if (exitCode !== 0 || signal !== null) {
    throw new Error(
      `${expected.label} worker exited abnormally: code=${String(exitCode)} signal=${String(signal)}`,
    );
  }
  if (messages.length !== 1) {
    throw new Error(`${expected.label} worker sent ${messages.length} terminal IPC messages, expected 1`);
  }
  const message = messages[0];
  if (!isRecord(message)) throw new Error(`${expected.label} worker IPC must be an object`);
  if (message.kind !== "gate2b-v5p-result") {
    throw new Error(`${expected.label} worker IPC kind is invalid: ${String(message.kind)}`);
  }
  if (message.role !== expected.role) {
    throw new Error(`${expected.label} worker role mismatch: ${String(message.role)}`);
  }
  if (message.tempC !== expected.tempC) {
    throw new Error(`${expected.label} worker temperature mismatch: ${String(message.tempC)}`);
  }
  if (message.checkpointPath !== expected.checkpointPath) {
    throw new Error(
      `${expected.label} worker checkpoint mismatch: ${String(message.checkpointPath)}`,
    );
  }
  if (!isRecord(message.result)) throw new Error(`${expected.label} worker result must be an object`);
  const result = message.result;
  if (result.surfacePolicy !== "aggregate-hv-g1h1-v5") {
    throw new Error(`${expected.label} worker result policy is invalid: ${String(result.surfacePolicy)}`);
  }
  if (
    result.stopReason !== "size-target" &&
    result.stopReason !== "domain-contact" &&
    result.stopReason !== "step-cap" &&
    result.stopReason !== "stalled" &&
    result.stopReason !== "unconverged"
  ) {
    throw new Error(`${expected.label} worker stop reason is invalid: ${String(result.stopReason)}`);
  }
  for (const key of ["symmetryClean", "allConverged"] as const) {
    if (typeof result[key] !== "boolean") {
      throw new Error(`${expected.label} worker result ${key} must be boolean`);
    }
  }
  for (const key of ["attached", "seedSites", "tick", "extent", "holeFillCountTotal"] as const) {
    const value = requireFiniteResultNumber(result, key);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${expected.label} worker result ${key} must be a nonnegative safe integer`);
    }
  }
  for (const key of [
    "aspectRatio",
    "finalSymErr",
    "minShellInjection",
    "minSurfaceExchange",
    "worstDivergence",
    "maxKineticFillEver",
    "pecletBound",
    "simTimeSeconds",
  ] as const) {
    requireFiniteResultNumber(result, key);
  }
  for (const key of ["maxAbsSmootherDrift", "smootherDriftAbsLimit"] as const) {
    const value = result[key];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value))) {
      throw new Error(`${expected.label} worker result ${key} must be finite or null`);
    }
  }
  return message as unknown as Gate2bWorkerEnvelope;
}

/** Revalidate the run-level aggregate so missing/shifted v5 drift evidence cannot pass later. */
export function validateGate2bDriftSummary(
  surfacePolicy: LKSurfacePolicy,
  maxAbsSmootherDrift: number | null,
  smootherDriftAbsLimit: number | null,
): void {
  if (metersSmootherDrift(surfacePolicy)) {
    if (
      maxAbsSmootherDrift === null ||
      !Number.isFinite(maxAbsSmootherDrift) ||
      maxAbsSmootherDrift < 0 ||
      smootherDriftAbsLimit === null ||
      !Number.isFinite(smootherDriftAbsLimit) ||
      !(smootherDriftAbsLimit > 0)
    ) {
      throw new Error(
        `invalid ${surfacePolicy} smoother drift summary ` +
          `(maxAbs=${String(maxAbsSmootherDrift)}, bound=${String(smootherDriftAbsLimit)})`,
      );
    }
    if (maxAbsSmootherDrift > smootherDriftAbsLimit) {
      throw new Error(
        `${surfacePolicy} maximum smoother drift ${maxAbsSmootherDrift} exceeds bound ` +
          `${smootherDriftAbsLimit}`,
      );
    }
    return;
  }
  if (maxAbsSmootherDrift !== null || smootherDriftAbsLimit !== null) {
    throw new Error(`policy ${surfacePolicy} must not carry smoother drift summary fields`);
  }
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
  surfacePolicy: LKSurfacePolicy,
  smootherDriftAbsLimit: number | null,
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
  const drift = relaxation.smootherDriftDiagnostic;
  if (metersSmootherDrift(surfacePolicy)) {
    if (drift === null || !Number.isFinite(drift)) {
      throw new Error(`gate2b invalid ${surfacePolicy} smoother drift: ${String(drift)}`);
    }
    if (
      smootherDriftAbsLimit === null ||
      !Number.isFinite(smootherDriftAbsLimit) ||
      smootherDriftAbsLimit < 0
    ) {
      throw new Error(
        `gate2b invalid independent smoother drift bound: ${String(smootherDriftAbsLimit)}`,
      );
    }
    if (Math.abs(drift) > smootherDriftAbsLimit) {
      throw new Error(
        `gate2b smoother drift ${drift} exceeds float64 roundoff bound ` +
          `${smootherDriftAbsLimit}`,
      );
    }
  } else if (drift !== null) {
    throw new Error(
      `gate2b policy ${surfacePolicy} must not report a smoother drift term`,
    );
  } else if (smootherDriftAbsLimit !== null) {
    throw new Error(
      `gate2b policy ${surfacePolicy} must not use a smoother drift bound`,
    );
  }
  const reportedDivergence = relaxation.divergenceResidual;
  if (
    reportedDivergence === null ||
    !Number.isFinite(reportedDivergence) ||
    reportedDivergence < 0
  ) {
    throw new Error(`gate2b invalid divergence residual: ${String(reportedDivergence)}`);
  }
  const recomputedDivergence =
    Math.abs(shell + (drift ?? 0) - exchange) / Math.max(Math.abs(exchange), 1e-300);
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
    smootherDrift: drift,
    smootherDriftAbsLimit,
  };
}
