import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { decodeLKCheckpoint } from "@vcc/core";
import {
  GATE2B_NODE,
  GATE2B_PREREGISTRATION,
  GATE2B_WORKER_SPECS,
  GATE2B_V8,
  validateGate2bDriftSummary,
  validateGate2bOutputAbsence,
  validateGate2bProvenance,
  validateGate2bWorkerCompletion,
  validateLKStepEvidence,
} from "../src/gate2b-validation.ts";

const temporaryDirectories: string[] = [];

function temporaryCheckpoint(): string {
  const directory = mkdtempSync(join(tmpdir(), "vcc-lk-runner-"));
  temporaryDirectories.push(directory);
  return join(directory, "state.ckpt");
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    rmSync(temporaryDirectories.pop() as string, { recursive: true, force: true });
  }
});

describe("grow-lk policy/checkpoint evidence path", () => {
  it("writes a strict v2 checkpoint carrying the solver's actual forward policy", () => {
    const output = temporaryCheckpoint();
    const stdout = execFileSync(
      process.execPath,
      [
        "runner/src/main.ts",
        "grow-lk",
        "--temp-c",
        "-5",
        "--sigma-inf",
        "0.002",
        "--dims",
        "8,8,8",
        "--steps",
        "0",
        "--metrics-every",
        "0",
        "--out",
        output,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(stdout).toContain("surfacePolicy=aggregate-hv-g1h1-v5");
    expect(stdout).toContain("roundTripIdentical=true");
    const decoded = decodeLKCheckpoint(new Uint8Array(readFileSync(output)));
    expect(decoded.header.version).toBe(2);
    expect(decoded.header.surfacePolicy).toBe("aggregate-hv-g1h1-v5");
    expect(decoded.state.surfacePolicy).toBe("aggregate-hv-g1h1-v5");
  });

  it("rejects unknown exploratory policies before solver construction", () => {
    const result = spawnSync(
      process.execPath,
      [
        "runner/src/main.ts",
        "grow-lk",
        "--temp-c",
        "-5",
        "--sigma-inf",
        "0.002",
        "--surface-policy",
        "unknown",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/surface-policy is invalid/);
  });

  it("routes explicit aggregate-v5 through CLI and strict checkpoint round trip", () => {
    const output = temporaryCheckpoint();
    const stdout = execFileSync(
      process.execPath,
      [
        "runner/src/main.ts",
        "grow-lk",
        "--temp-c",
        "-15",
        "--sigma-inf",
        "0.002",
        "--dims",
        "8,8,8",
        "--steps",
        "0",
        "--metrics-every",
        "0",
        "--surface-policy",
        "aggregate-hv-g1h1-v5",
        "--out",
        output,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(stdout).toContain("surfacePolicy=aggregate-hv-g1h1-v5");
    expect(stdout).toContain("smootherDriftLimit=");
    expect(stdout).toContain("roundTripIdentical=true");
    const decoded = decodeLKCheckpoint(new Uint8Array(readFileSync(output)));
    expect(decoded.header.version).toBe(2);
    expect(decoded.header.surfacePolicy).toBe("aggregate-hv-g1h1-v5");
    expect(decoded.state.surfacePolicy).toBe("aggregate-hv-g1h1-v5");
  });

  it("retains aggregate-v4 only through an explicit historical reproduction route", () => {
    const output = temporaryCheckpoint();
    const stdout = execFileSync(
      process.execPath,
      [
        "runner/src/main.ts",
        "grow-lk",
        "--temp-c",
        "-15",
        "--sigma-inf",
        "0.002",
        "--dims",
        "8,8,8",
        "--steps",
        "0",
        "--metrics-every",
        "0",
        "--surface-policy",
        "aggregate-hv-g1h1-v4",
        "--out",
        output,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(stdout).toContain("surfacePolicy=aggregate-hv-g1h1-v4");
    const decoded = decodeLKCheckpoint(new Uint8Array(readFileSync(output)));
    expect(decoded.header.surfacePolicy).toBe("aggregate-hv-g1h1-v4");
    expect(decoded.state.surfacePolicy).toBe("aggregate-hv-g1h1-v4");
  });

  it("produces bit-identical compact checkpoints sequentially and in concurrent processes", async () => {
    const sequentialPlate = temporaryCheckpoint();
    const sequentialColumn = temporaryCheckpoint();
    const concurrentPlate = temporaryCheckpoint();
    const concurrentColumn = temporaryCheckpoint();
    const args = (tempC: -5 | -15, output: string): string[] => [
      "runner/src/main.ts",
      "grow-lk",
      "--temp-c",
      String(tempC),
      "--sigma-inf",
      "0.002",
      "--dims",
      "8,8,8",
      "--steps",
      "1",
      "--metrics-every",
      "0",
      "--surface-policy",
      "aggregate-hv-g1h1-v5",
      "--out",
      output,
    ];
    execFileSync(process.execPath, args(-5, sequentialPlate), { cwd: process.cwd() });
    execFileSync(process.execPath, args(-15, sequentialColumn), { cwd: process.cwd() });

    const runConcurrent = (tempC: -5 | -15, output: string) => {
      const child = spawn(process.execPath, args(tempC, output), {
        cwd: process.cwd(),
        stdio: "ignore",
      });
      const completion = new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => {
          if (code === 0 && signal === null) resolve();
          else reject(new Error(`compact child failed: code=${String(code)} signal=${String(signal)}`));
        });
      });
      return { child, completion };
    };
    const warm = runConcurrent(-5, concurrentPlate);
    const cold = runConcurrent(-15, concurrentColumn);
    expect(warm.child.pid).toBeTypeOf("number");
    expect(cold.child.pid).toBeTypeOf("number");
    expect(warm.child.pid).not.toBe(cold.child.pid);
    await Promise.all([warm.completion, cold.completion]);

    expect(readFileSync(concurrentPlate).equals(readFileSync(sequentialPlate))).toBe(true);
    expect(readFileSync(concurrentColumn).equals(readFileSync(sequentialColumn))).toBe(true);
  }, 30_000);

  it("keeps gate2b flagless and exits 2 before any evidence work", () => {
    const result = spawnSync(
      process.execPath,
      ["runner/src/main.ts", "gate2b", "--surface-policy", "legacy-v3"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("gate2b takes no flags");
  });
});

describe("gate2b fail-closed evidence validation", () => {
  it("rejects wrong engines, unidentified commits, and tracked changes", () => {
    expect(GATE2B_PREREGISTRATION).toBe("8adea86ef3fcf8f6ba8ea5a3764e56de6d193f49");
    const valid = {
      node: GATE2B_NODE,
      v8: GATE2B_V8,
      head: "a".repeat(40),
      trackedStatus: "",
      preregistrationIsAncestor: true,
    };
    expect(() => validateGate2bProvenance(valid)).not.toThrow();
    expect(() => validateGate2bProvenance({ ...valid, node: "v0.0.0" })).toThrow(/engine/);
    expect(() => validateGate2bProvenance({ ...valid, v8: "wrong" })).toThrow(/engine/);
    expect(() => validateGate2bProvenance({ ...valid, head: "not-a-commit" })).toThrow(
      /execution commit/,
    );
    expect(() => validateGate2bProvenance({ ...valid, trackedStatus: " M core/src/x.ts" })).toThrow(
      /tracked-clean/,
    );
    expect(() =>
      validateGate2bProvenance({ ...valid, preregistrationIsAncestor: false }),
    ).toThrow(/not an ancestor/);
  });

  it("accepts one finite, independently balanced LK step", () => {
    const shell = 1;
    const exchange = 0.99999995;
    const divergence = Math.abs(shell - exchange) / exchange;
    expect(
      validateLKStepEvidence(
        {
          sweeps: 10,
          residual: 5e-10,
          converged: true,
          divergenceResidual: divergence,
          shellClampDiagnostic: shell,
          surfaceExchangeDiagnostic: exchange,
          smootherDriftDiagnostic: null,
          minLocalSurfaceExchangeDiagnostic: -0.01,
        },
        {
          attachedNow: 1,
          maxKineticFillIncrement: 0.1,
          holeFillCount: 0,
          deltaTimeSeconds: 1,
          stalled: false,
          skippedUnconverged: false,
        },
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v4",
        null,
      ),
    ).toEqual({
      divergenceResidual: divergence,
      maxKineticFillIncrement: 0.1,
      shellInjection: shell,
      surfaceExchange: exchange,
      smootherDrift: null,
      smootherDriftAbsLimit: null,
    });
  });

  it("binds each concurrent worker's role, temperature, checkpoint, IPC count, and exit", () => {
    expect(() => validateGate2bOutputAbsence([])).not.toThrow();
    expect(() => validateGate2bOutputAbsence([GATE2B_WORKER_SPECS.plate.checkpointPath])).toThrow(
      /must be absent/,
    );
    const spec = GATE2B_WORKER_SPECS.plate;
    const result = {
      surfacePolicy: "aggregate-hv-g1h1-v5",
      stopReason: "size-target",
      aspectRatio: 0.1,
      attached: 100,
      seedSites: 19,
      tick: 10,
      extent: 60,
      symmetryClean: true,
      finalSymErr: 0,
      allConverged: true,
      minShellInjection: 1e-6,
      minSurfaceExchange: 1e-6,
      worstDivergence: 1e-8,
      maxAbsSmootherDrift: 1e-13,
      smootherDriftAbsLimit: 1e-9,
      maxKineticFillEver: 0.1,
      holeFillCountTotal: 0,
      pecletBound: 1e-6,
      simTimeSeconds: 1,
    } as const;
    const envelope = {
      kind: "gate2b-v5p-result",
      role: spec.role,
      tempC: spec.tempC,
      checkpointPath: spec.checkpointPath,
      result,
    } as const;
    expect(validateGate2bWorkerCompletion(spec, [envelope], 0, null)).toEqual(envelope);
    expect(() => validateGate2bWorkerCompletion(spec, [], 0, null)).toThrow(/0 terminal IPC/);
    expect(() => validateGate2bWorkerCompletion(spec, [envelope, envelope], 0, null)).toThrow(
      /2 terminal IPC/,
    );
    expect(() => validateGate2bWorkerCompletion(spec, [envelope], 1, null)).toThrow(/abnormally/);
    expect(() => validateGate2bWorkerCompletion(spec, [envelope], null, "SIGTERM")).toThrow(
      /abnormally/,
    );
    expect(() =>
      validateGate2bWorkerCompletion(spec, [{ ...envelope, role: "column" }], 0, null),
    ).toThrow(/role mismatch/);
    expect(() =>
      validateGate2bWorkerCompletion(spec, [{ ...envelope, tempC: -15 }], 0, null),
    ).toThrow(/temperature mismatch/);
    expect(() =>
      validateGate2bWorkerCompletion(
        spec,
        [{ ...envelope, checkpointPath: GATE2B_WORKER_SPECS.column.checkpointPath }],
        0,
        null,
      ),
    ).toThrow(/checkpoint mismatch/);
    expect(() =>
      validateGate2bWorkerCompletion(
        spec,
        [{ ...envelope, result: { ...result, worstDivergence: Number.NaN } }],
        0,
        null,
      ),
    ).toThrow(/worstDivergence must be finite/);
  });

  it("revalidates aggregate-v5 run-level drift summaries and rejects shifted fields", () => {
    expect(() =>
      validateGate2bDriftSummary("aggregate-hv-g1h1-v5", 1e-13, 1e-9),
    ).not.toThrow();
    expect(() =>
      validateGate2bDriftSummary("aggregate-hv-g1h1-v5", null, 1e-9),
    ).toThrow(/drift summary/);
    expect(() =>
      validateGate2bDriftSummary("aggregate-hv-g1h1-v5", 1e-8, 1e-9),
    ).toThrow(/exceeds bound/);
    expect(() =>
      validateGate2bDriftSummary("aggregate-hv-g1h1-v4", 0, null),
    ).toThrow(/must not carry/);
    expect(() => validateGate2bDriftSummary("aggregate-hv-g1h1-v4", null, null)).not.toThrow();
  });

  it("requires and independently recomputes aggregate-v5 smoother drift", () => {
    const shell = 1;
    const exchange = 0.99999995;
    const drift = -1e-12;
    const driftLimit = 1e-9;
    const divergence = Math.abs(shell + drift - exchange) / exchange;
    const relaxation = {
      sweeps: 10,
      residual: 5e-10,
      converged: true,
      divergenceResidual: divergence,
      shellClampDiagnostic: shell,
      surfaceExchangeDiagnostic: exchange,
      smootherDriftDiagnostic: drift,
      minLocalSurfaceExchangeDiagnostic: -0.01,
    } as const;
    const surface = {
      attachedNow: 1,
      maxKineticFillIncrement: 0.1,
      holeFillCount: 0,
      deltaTimeSeconds: 1,
      stalled: false,
      skippedUnconverged: false,
    } as const;
    expect(
      validateLKStepEvidence(
        relaxation,
        surface,
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v5",
        driftLimit,
      ),
    ).toEqual({
      divergenceResidual: divergence,
      maxKineticFillIncrement: 0.1,
      shellInjection: shell,
      surfaceExchange: exchange,
      smootherDrift: drift,
      smootherDriftAbsLimit: driftLimit,
    });
    expect(() =>
      validateLKStepEvidence(
        { ...relaxation, smootherDriftDiagnostic: null },
        surface,
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v5",
        driftLimit,
      ),
    ).toThrow(/smoother drift/);
    expect(() =>
      validateLKStepEvidence(
        relaxation,
        surface,
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v5",
        null,
      ),
    ).toThrow(/drift bound/);
    expect(() =>
      validateLKStepEvidence(
        relaxation,
        surface,
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v5",
        Number.NaN,
      ),
    ).toThrow(/drift bound/);
    expect(() =>
      validateLKStepEvidence(
        { ...relaxation, smootherDriftDiagnostic: drift * 2 },
        surface,
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v5",
        driftLimit,
      ),
    ).toThrow(/divergence report mismatch/);

    const maskingExchange = 1e-6;
    const maskingDrift = maskingExchange - shell;
    const maskingDivergence =
      Math.abs(shell + maskingDrift - maskingExchange) / maskingExchange;
    expect(() =>
      validateLKStepEvidence(
        {
          ...relaxation,
          surfaceExchangeDiagnostic: maskingExchange,
          smootherDriftDiagnostic: maskingDrift,
          divergenceResidual: maskingDivergence,
        },
        surface,
        1e-9,
        1e-7,
        "aggregate-hv-g1h1-v5",
        driftLimit,
      ),
    ).toThrow(/roundoff bound/);
  });

  it("rejects null, NaN, infinity, nonpositive, and self-inconsistent step evidence", () => {
    const shell = 1;
    const exchange = 0.99999995;
    const divergence = Math.abs(shell - exchange) / exchange;
    const relaxation = {
      sweeps: 10,
      residual: 5e-10,
      converged: true,
      divergenceResidual: divergence,
      shellClampDiagnostic: shell,
      surfaceExchangeDiagnostic: exchange,
      smootherDriftDiagnostic: null,
      minLocalSurfaceExchangeDiagnostic: -0.01,
    } as const;
    const surface = {
      attachedNow: 1,
      maxKineticFillIncrement: 0.1,
      holeFillCount: 0,
      deltaTimeSeconds: 1,
      stalled: false,
      skippedUnconverged: false,
    } as const;
    const invalidRelaxations = [
      { ...relaxation, converged: false },
      { ...relaxation, sweeps: 0 },
      { ...relaxation, residual: null },
      { ...relaxation, residual: Number.NaN },
      { ...relaxation, residual: 1e-9 },
      { ...relaxation, divergenceResidual: null },
      { ...relaxation, divergenceResidual: Number.NaN },
      { ...relaxation, divergenceResidual: 0 },
      { ...relaxation, shellClampDiagnostic: Number.POSITIVE_INFINITY },
      { ...relaxation, shellClampDiagnostic: 0 },
      { ...relaxation, surfaceExchangeDiagnostic: Number.POSITIVE_INFINITY },
      { ...relaxation, surfaceExchangeDiagnostic: 0 },
      { ...relaxation, smootherDriftDiagnostic: 0 },
    ];
    for (const sample of invalidRelaxations) {
      expect(() =>
        validateLKStepEvidence(sample, surface, 1e-9, 1e-7, "aggregate-hv-g1h1-v4", null),
      ).toThrow();
    }
    const invalidSurfaces = [
      { ...surface, maxKineticFillIncrement: null },
      { ...surface, maxKineticFillIncrement: Number.NaN },
      { ...surface, maxKineticFillIncrement: 0 },
      { ...surface, deltaTimeSeconds: Number.POSITIVE_INFINITY },
      { ...surface, deltaTimeSeconds: 0 },
      { ...surface, stalled: true },
      { ...surface, skippedUnconverged: true },
    ];
    for (const sample of invalidSurfaces) {
      expect(() =>
        validateLKStepEvidence(
          relaxation,
          sample,
          1e-9,
          1e-7,
          "aggregate-hv-g1h1-v4",
          null,
        ),
      ).toThrow();
    }
  });
});
