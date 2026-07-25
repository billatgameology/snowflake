import { describe, expect, it } from "vitest";
import {
  GPU_LK_REPORT_BYTES,
  GPU_LK_REPORT_WORD,
} from "../src/lk-shaders.ts";
import { decodeGpuLkCompactReport } from "../src/lk-solver.ts";

function reportBytes(overrides: Readonly<Record<number, number>> = {}): ArrayBuffer {
  const bytes = new ArrayBuffer(GPU_LK_REPORT_BYTES);
  const view = new DataView(bytes);
  view.setUint32(GPU_LK_REPORT_WORD.activeOwner * 4, 1, true);
  view.setUint32(GPU_LK_REPORT_WORD.converged * 4, 1, true);
  view.setUint32(GPU_LK_REPORT_WORD.convergenceMode * 4, 2, true);
  view.setUint32(GPU_LK_REPORT_WORD.performedSweeps * 4, 1, true);
  view.setUint32(
    GPU_LK_REPORT_WORD.maximumCurrentStepUlpDistance * 4,
    1,
    true,
  );
  view.setUint32(GPU_LK_REPORT_WORD.maximumTwoBackUlpDistance * 4, 0, true);
  view.setUint32(
    GPU_LK_REPORT_WORD.completedSweepsAfterMutation * 4,
    17,
    true,
  );
  view.setUint32(GPU_LK_REPORT_WORD.previousDivergenceStatus * 4, 1, true);
  view.setFloat32(GPU_LK_REPORT_WORD.previousDivergenceResidual * 4, 0, true);
  view.setUint32(GPU_LK_REPORT_WORD.previousDriftBoundPassed * 4, 1, true);
  for (const [word, value] of Object.entries(overrides)) {
    view.setUint32(Number(word) * 4, value, true);
  }
  return bytes;
}

describe("GPU LK bounded-cycle compact report", () => {
  it("decodes the explicit mode, ULP maxima, history, and prior guards", () => {
    const report = decodeGpuLkCompactReport(reportBytes());
    expect(report).toMatchObject({
      converged: true,
      convergenceMode: "bounded-two-cycle",
      performedSweeps: 1,
      activeOwner: 1,
      maximumCurrentStepUlpDistance: 1,
      maximumTwoBackUlpDistance: 0,
      completedSweepsAfterMutation: 17,
      previousDivergenceStatus: "finite",
      previousDivergenceResidual: 0,
      previousDriftBoundPassed: true,
    });
  });

  it("rejects convergence-mode, flag, divergence-status, and drift-result shifts", () => {
    expect(() =>
      decodeGpuLkCompactReport(
        reportBytes({ [GPU_LK_REPORT_WORD.convergenceMode]: 3 }),
      ),
    ).toThrow(/convergence mode/);
    expect(() =>
      decodeGpuLkCompactReport(
        reportBytes({ [GPU_LK_REPORT_WORD.converged]: 0 }),
      ),
    ).toThrow(/convergence flag/);
    expect(() =>
      decodeGpuLkCompactReport(
        reportBytes({ [GPU_LK_REPORT_WORD.previousDivergenceStatus]: 4 }),
      ),
    ).toThrow(/divergence status/);
    expect(() =>
      decodeGpuLkCompactReport(
        reportBytes({ [GPU_LK_REPORT_WORD.previousDriftBoundPassed]: 2 }),
      ),
    ).toThrow(/prior drift/);
  });
});
