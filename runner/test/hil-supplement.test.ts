import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FIRST_BATCH_ROWS, namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { firstBatchRosterSha256 } from "../src/hil-bld-batch-main.ts";
import { hilSupplementCampaignBinding, validateHilSupplementCampaign } from "../src/hil-supplement-main.ts";
import { HIL_SUPPLEMENT, HIL_SUPPLEMENT_ROWS } from "../src/hil-supplement-roster.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-hil-supplement-"));
  temporary.push(path);
  return path;
}
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-supplement-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });

describe("registered HIL history and pressure supplement", () => {
  it("contains exactly the eight registered contrasts and changes only their named controls", () => {
    const suffixes = [
      "history-t6-to-t14p4-e7-m1", "history-t6-to-t14p4-e15-m1",
      "history-t14p4-to-t6-e7-m1", "history-t14p4-to-t6-e15-m1",
      "pressure-t6-f0p1-p50662p5-both", "pressure-t6-f0p1-p202650-both",
      "pressure-t6-f0p2-p50662p5-both", "pressure-t6-f0p2-p202650-both",
    ];
    expect(HIL_SUPPLEMENT_ROWS.map(({ row }) => row.id)).toEqual(suffixes.map((suffix) => `supplement-hil-${suffix}`));
    expect(new Set(HIL_SUPPLEMENT_ROWS.map(({ row }) => row.id)).size).toBe(8);
    for (const entry of HIL_SUPPLEMENT_ROWS) {
      const { row } = entry;
      const control = FIRST_BATCH_ROWS.find(({ row: old }) => old.id === row.id.replace("supplement-hil-", "batch1-hil-"))!;
      expect(entry.host).toBe("HIL");
      expect(entry.track).toBe(control.track);
      if (entry.track === "environment-history") {
        expect(row).toEqual({ ...control.row, id: row.id, targetExtent: 29, spatialSampleExtents: [5, 9, 13, 17, 21, 25] });
        expect(row.experimentalFacetDips).toBeUndefined();
      } else {
        expect(entry.track).toBe("pressure");
        expect(row).toEqual({ ...control.row, id: row.id, cflFill: 0.025 });
        expect(row.timelineEvent).toBeUndefined();
      }
      expect(row.maxSteps).toBe(20000);
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.spatialSampleExtents)).toBe(true);
    }
    expect(HIL_SUPPLEMENT.workerCeilings).toEqual({ HIL: 8 });
    expect(() => namedBatchRows(HIL_SUPPLEMENT, "BLD")).toThrow("not assigned");
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
  });

  it("refuses changed source, runtime, host, row and operational budget before resume", () => {
    const campaign = hilSupplementCampaignBinding();
    expect(() => validateHilSupplementCampaign(campaign)).not.toThrow();
    for (const mutation of [
      { schema: "hil-bld-first-batch-campaign-v2" }, { batchId: "other" },
      { checkpointFormat: "old" }, { host: "BLD" }, { gitHead: "different" },
      { node: "different" }, { v8: "different" }, { requestedConcurrency: 16 },
      { hostIdentity: { ...campaign.hostIdentity, hostname: "other-computer" } },
      { rosterSha256: "wrong" }, { rows: campaign.rows.slice(1) },
      { rows: [{ ...campaign.rows[0], targetExtent: 31 }, ...campaign.rows.slice(1)] },
    ]) expect(() => validateHilSupplementCampaign({ ...campaign, ...mutation })).toThrow("does not match");
    expect(() => validateHilSupplementCampaign(null)).toThrow("missing");
  });

  it("routes the executable list and both checkpointed worker commands through the registered batch", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout)).toMatchObject({ batchId: HIL_SUPPLEMENT.id, host: "HIL", workerCeiling: 8 });
    expect(JSON.parse(listed.stdout).entries).toEqual(HIL_SUPPLEMENT_ROWS);
    expect(cli("list", "BLD").stderr).toContain("not assigned");
    expect(cli("launch", "BLD", "unused-output").stderr).toContain("assigned only to HIL");
    expect(cli("probe", "HIL", "unused-output").status).toBe(1);
    for (const command of ["run-row", "resume-row"]) {
      const unknown = cli(command, FIRST_BATCH_ROWS[0].row.id, "unused-output");
      expect(unknown.status).toBe(1);
      expect(unknown.stderr).toContain(`unknown ${HIL_SUPPLEMENT.id} row`);
      const output = directory();
      writeFileSync(join(output, "spec.json"), JSON.stringify({ row: { id: "different" } }));
      const routed = cli(command, HIL_SUPPLEMENT_ROWS[0].row.id, output);
      expect(routed.status).toBe(1);
      expect(routed.stderr).toContain(command === "run-row" ? "output already exists" : "resume row spec mismatch");
    }
  });
});
