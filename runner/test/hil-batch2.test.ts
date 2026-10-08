import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { HIL_BATCH2, HIL_BATCH2_ROWS } from "../src/hil-batch2-roster.ts";
import { FIRST_BATCH_DEFINITION, FIRST_BATCH_ROWS, namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { firstBatchProbeRows, firstBatchRosterSha256, validateFirstBatchCampaignReceipt,
  validateFirstBatchProbeReceipt, type FirstBatchCampaignReceipt, type FirstBatchProbeReceipt } from "../src/hil-bld-batch-main.ts";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";

function probe(batch = HIL_BATCH2): FirstBatchProbeReceipt {
  return { schema: "hil-bld-first-batch-probe-v1", batchId: batch.id, host: "HIL",
    gitHead: batchGitHead(), node: process.version, v8: process.versions.v8,
    hostIdentity: batchHostIdentity(), rosterSha256: firstBatchRosterSha256("HIL", batch), recommendedConcurrency: 16,
    rungs: [{ concurrency: 16, qualified: true, directory: "fixture", actualMaximumConcurrency: 16,
      wallSeconds: 60, rowsPerSecond: 16 / 60, abortReason: null,
      minimumAvailablePhysicalBytes: 20 * 1024 ** 3, minimumCommitHeadroomBytes: 20 * 1024 ** 3,
      maxSampledChildRssBytes: 1024, rowIds: [] }], limit: "fixture, not measured capacity" };
}

describe("registered HIL second batch", () => {
  it("contains each prescribed new factorial corner once with unchanged scientific controls", () => {
    const expected = [
      ...[[3, 1], [1, 5]].flatMap(([r, t]) => ["both", "neither", "basal-only", "prism-only"]
        .map((arm) => `seed/-8/0.15/${r}/${t}/${arm}`)),
      ...[0.1, 0.2].flatMap((f) => ["both", "neither", "basal-only", "prism-only"]
        .map((arm) => `pressure/-6/${f}/2/1/${arm}`)),
    ];
    const actual = HIL_BATCH2_ROWS.map(({ host, track, row }) => {
      expect(host).toBe("HIL");
      expect(row).toMatchObject({ paramSet: "M1", pressurePa: 101325, dimsN: 64, dxUm: 0.35,
        cflFill: 0.05, targetExtent: 21, maxSteps: 20000, spatialSampleExtents: [5, 9, 13, 17] });
      expect(row.sigmaInfinity).toBe(phase6SigmaWaterFromTable(row.tempC) * row.fraction);
      expect(row.timelineEvent).toBeUndefined();
      expect(row.experimentalBasalWidthCells).toBeUndefined();
      expect(row.experimentalHoleFilling).toBeUndefined();
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.spatialSampleExtents)).toBe(true);
      expect(FIRST_BATCH_ROWS.some(({ row: old }) => old.tempC === row.tempC && old.fraction === row.fraction &&
        old.pressurePa === row.pressurePa && old.seedRadius === row.seedRadius && old.seedThickness === row.seedThickness &&
        old.experimentalFacetDips === row.experimentalFacetDips)).toBe(false);
      return `${track}/${row.tempC}/${row.fraction}/${row.seedRadius}/${row.seedThickness}/${row.experimentalFacetDips}`;
    });
    expect(actual.sort()).toEqual(expected.sort());
    expect(new Set(HIL_BATCH2_ROWS.map(({ row }) => row.id)).size).toBe(16);
    expect(() => namedBatchRows(HIL_BATCH2, "BLD")).toThrow("not assigned");
  });

  it("retains the exact original roster bytes and probes actual new preparations", () => {
    // Recomputed at retained original b9cf7ed, before the shared-runner change.
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
    for (const concurrency of [1, 4, 8, 16]) {
      const prefixes = firstBatchProbeRows("HIL", concurrency, HIL_BATCH2);
      expect(prefixes).toHaveLength(Math.max(4, concurrency));
      expect(new Set(prefixes.map((row) => row.id)).size).toBe(prefixes.length);
      for (const row of prefixes) {
        const original = HIL_BATCH2_ROWS.find((entry) => entry.row.id === row.id.replace(/--probe-\d+$/, ""))!.row;
        expect(row).toEqual({ ...original, id: row.id, maxSteps: 3 });
      }
    }
    expect(new Set(HIL_BATCH2.representatives("HIL").map(({ row }) => row.experimentalFacetDips)))
      .toEqual(new Set(["both", "neither", "basal-only", "prism-only"]));
    expect(() => firstBatchProbeRows("BLD", 1, HIL_BATCH2)).toThrow("not assigned");
  });

  it("refuses cross-batch probe/campaign reuse and edited second-batch rows", () => {
    const receipt = probe();
    expect(validateFirstBatchProbeReceipt(receipt, "HIL", HIL_BATCH2)).toBe(16);
    expect(() => validateFirstBatchProbeReceipt(receipt, "HIL")).toThrow("different batch");
    expect(() => validateFirstBatchProbeReceipt(probe(FIRST_BATCH_DEFINITION), "HIL", HIL_BATCH2)).toThrow("different batch");
    expect(() => validateFirstBatchProbeReceipt({ ...receipt, rosterSha256: firstBatchRosterSha256("HIL") }, "HIL", HIL_BATCH2))
      .toThrow("workload");
    const bytes = Buffer.from(JSON.stringify(receipt));
    const campaign: FirstBatchCampaignReceipt = { ...receipt, schema: "hil-bld-first-batch-campaign-v2",
      checkpointFormat: "discovery-resume-v1", probeReceiptSha256: createHash("sha256").update(bytes).digest("hex"),
      requestedConcurrency: 16, rows: HIL_BATCH2_ROWS.map(({ row }) => row) };
    expect(validateFirstBatchCampaignReceipt(campaign, "HIL", bytes, HIL_BATCH2)).toBe(16);
    expect(() => validateFirstBatchCampaignReceipt({ ...campaign, batchId: FIRST_BATCH_DEFINITION.id }, "HIL", bytes, HIL_BATCH2))
      .toThrow("this resumable batch");
    expect(() => validateFirstBatchCampaignReceipt({ ...campaign, rows: campaign.rows.slice(1) }, "HIL", bytes, HIL_BATCH2))
      .toThrow("rows or probe binding");
    expect(() => validateFirstBatchCampaignReceipt(campaign, "BLD", bytes, HIL_BATCH2)).toThrow("not assigned");
  });

  it("routes the real entry point to its own roster and refuses old worker IDs", () => {
    const cli = (args: string[]) => spawnSync(process.execPath, ["runner/src/hil-batch2-main.ts", ...args],
      { encoding: "utf8", windowsHide: true });
    const list = cli(["list", "HIL"]);
    expect(list.status, list.stderr).toBe(0);
    expect(JSON.parse(list.stdout)).toMatchObject({ batchId: HIL_BATCH2.id, host: "HIL", workerCeiling: 16 });
    expect(JSON.parse(list.stdout).entries).toEqual(HIL_BATCH2_ROWS);
    expect(cli(["list", "BLD"]).stderr).toContain("not assigned");
    const wrongWorker = cli(["run-row", FIRST_BATCH_ROWS[0].row.id, "unused-output"]);
    expect(wrongWorker.status).toBe(1);
    expect(wrongWorker.stderr).toContain(`unknown ${HIL_BATCH2.id} row`);
  });
});
