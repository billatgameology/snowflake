import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { HIL_WARM_REFINEMENT as batch, HIL_WARM_REFINEMENT_ROWS as entries } from "../src/hil-warm-refinement-roster.ts";
import { FIRST_BATCH_DEFINITION, namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { batchProbeSettings, firstBatchProbeRows, firstBatchRosterSha256, validateFirstBatchProbeReceipt,
  type FirstBatchProbeReceipt } from "../src/hil-bld-batch-main.ts";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";

describe("HIL warm representation comparison", () => {
  it("names exactly three matched broad/early pairs with the registered physical scales", () => {
    expect(entries.map(({ row }) => row.id)).toEqual(["coarse", "fine-thin", "fine-thick"].flatMap((tag) =>
      ["broad", "early"].map((arm) => `warm-refine-${tag}-t4p5-${arm}`)));
    for (const [index, { host, track, row }] of entries.entries()) {
      expect(host).toBe("HIL"); expect(track).toBe("warm-history");
      expect(row).toMatchObject({ tempC: -4.5, fraction: 0.075, sigmaInfinity: 0.003375,
        pressurePa: 101325, cflFill: 0.05, maxSteps: 100000 });
      expect(row.dimsN).toBe(index < 2 ? 64 : 126);
      expect(row.seedThickness).toBe(index < 4 ? 1 : 3);
      expect((row.targetExtent - 1) * row.dxUm).toBeCloseTo(9.8, 12);
      expect((row.dimsN / 2 - 1) * row.dxUm).toBeCloseTo(10.85, 12);
      expect(row.seedRadius * row.dxUm).toBeCloseTo(0.7, 12);
      expect(row.spatialSampleExtents!.map((extent) => (extent - 1) * row.dxUm))
        .toEqual([4, 8, 12, 16, 20, 24].map((extent) => extent * 0.35));
      expect(row.timelineEvent).toBeUndefined(); expect(row.experimentalFacetDips).toBeUndefined();
      expect(row.experimentalHoleFilling).toBeUndefined();
      if (index % 2 === 0) {
        expect(row.paramSet).toBe("M1_NO_DIP_ABLATION");
        expect(row.experimentalBasalWidthCells).toBeUndefined();
        expect(row.experimentalBasalWidthHistory).toBeUndefined();
      } else {
        expect(row.paramSet).toBe("M1");
        expect(row.experimentalBasalWidthCells).toBe(index < 2 ? 3 : 6);
        expect(row.experimentalBasalWidthCells! * row.dxUm).toBeCloseTo(1.05, 12);
        expect(row.experimentalBasalWidthHistory).toEqual({ mode: "early-only", cutoffSeconds: 20 });
      }
    }
    expect(() => namedBatchRows(batch, "BLD")).toThrow("not assigned");
  });

  it("probes every exact family at 1/4/6 while preserving historical probe defaults", () => {
    expect(batchProbeSettings("HIL", batch)).toEqual({ ladder: [1, 4, 6], childWallSeconds: 1800 });
    expect(batchProbeSettings("HIL")).toEqual({ ladder: [1, 4, 8, 16], childWallSeconds: 180 });
    expect(batchProbeSettings("BLD")).toEqual({ ladder: [1, 4, 8, 16, 28], childWallSeconds: 180 });
    for (const concurrency of [1, 4, 6]) {
      expect(firstBatchProbeRows("HIL", concurrency, batch)).toEqual(entries.map(({ row }, index) => ({
        ...row, id: `${row.id}--probe-${index}`, maxSteps: 3,
      })));
    }
    expect(() => batchProbeSettings("HIL", { ...batch, probeWallSeconds: 0 })).toThrow("invalid batch probe limits");
    const receipt: FirstBatchProbeReceipt = { schema: "hil-bld-first-batch-probe-v1", batchId: batch.id, host: "HIL",
      gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
      hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256("HIL", batch), recommendedConcurrency: 6,
      rungs: [{ concurrency: 6, qualified: true, directory: "fixture", actualMaximumConcurrency: 6,
        wallSeconds: 60, rowsPerSecond: 0.1, abortReason: null, minimumAvailablePhysicalBytes: 20 * 1024 ** 3,
        minimumCommitHeadroomBytes: 20 * 1024 ** 3, maxSampledChildRssBytes: 1024, rowIds: [] }], limit: "fixture" };
    expect(validateFirstBatchProbeReceipt(receipt, "HIL", batch)).toBe(6);
    expect(() => validateFirstBatchProbeReceipt(receipt, "HIL", FIRST_BATCH_DEFINITION)).toThrow("different batch");
  });

  it("routes its entry point to this six-row batch", () => {
    const result = spawnSync(process.execPath, ["runner/src/hil-warm-refinement-main.ts", "list", "HIL"],
      { encoding: "utf8", windowsHide: true });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ batchId: batch.id, host: "HIL", workerCeiling: 6, entries });
  });
});
