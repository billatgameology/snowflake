import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { decodeLKCheckpoint } from "@vcc/core";
import {
  GATE2B_NODE,
  GATE2B_V8,
  validateGate2bProvenance,
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
    expect(stdout).toContain("surfacePolicy=aggregate-hv-g1h1-v4");
    expect(stdout).toContain("roundTripIdentical=true");
    const decoded = decodeLKCheckpoint(new Uint8Array(readFileSync(output)));
    expect(decoded.header.version).toBe(2);
    expect(decoded.header.surfacePolicy).toBe("aggregate-hv-g1h1-v4");
    expect(decoded.state.surfacePolicy).toBe("aggregate-hv-g1h1-v4");
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
      ),
    ).toEqual({
      divergenceResidual: divergence,
      maxKineticFillIncrement: 0.1,
      shellInjection: shell,
      surfaceExchange: exchange,
    });
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
    ];
    for (const sample of invalidRelaxations) {
      expect(() => validateLKStepEvidence(sample, surface, 1e-9, 1e-7)).toThrow();
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
      expect(() => validateLKStepEvidence(relaxation, sample, 1e-9, 1e-7)).toThrow();
    }
  });
});
