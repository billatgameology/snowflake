import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { FIRST_BATCH_ROWS, namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { firstBatchRosterSha256 } from "../src/hil-bld-batch-main.ts";
import { hilExplorationOct10CampaignBinding, validateHilExplorationOct10Campaign } from "../src/hil-exploration-oct10-main.ts";
import { HIL_EXPLORATION_OCT10, HIL_EXPLORATION_OCT10_ROWS } from "../src/hil-exploration-oct10-roster.ts";
import { hilSupplementCampaignBinding, validateHilSupplementCampaign } from "../src/hil-supplement-main.ts";
import { HIL_SUPPLEMENT, HIL_SUPPLEMENT_ROWS } from "../src/hil-supplement-roster.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-hil-oct10-"));
  temporary.push(path);
  return path;
}
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-exploration-oct10-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });

describe("registered October 10 HIL exploration", () => {
  it("contains exactly the ten named controls with only the registered target and sample changes", () => {
    const suffixes = [
      "history-t6-to-t14p4-e7-nodip", "history-t6-to-t14p4-e15-nodip",
      "history-t14p4-to-t6-e7-nodip", "history-t14p4-to-t6-e15-nodip",
      "cold-t14p4-f0p1-both", "cold-t14p4-f0p1-neither",
      "cold-t14p4-f0p1-basal-only", "cold-t14p4-f0p1-prism-only",
      "history-static-t6-m1", "history-static-t6-nodip",
    ];
    expect(HIL_EXPLORATION_OCT10_ROWS.map(({ row }) => row.id)).toEqual(suffixes.map((suffix) => `oct10-hil-${suffix}`));
    expect(new Set(HIL_EXPLORATION_OCT10_ROWS.map(({ row }) => row.id)).size).toBe(10);
    for (const entry of HIL_EXPLORATION_OCT10_ROWS) {
      const cold = entry.track === "cold-core-tip";
      const controlId = entry.row.id.replace("oct10-hil-", cold ? "batch1-bld-" : "batch1-hil-");
      const control = FIRST_BATCH_ROWS.find(({ row }) => row.id === controlId)!;
      expect(entry).toEqual({ ...control, host: "HIL", row: { ...control.row, id: entry.row.id,
        targetExtent: 29, spatialSampleExtents: cold ? [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27] : [5, 9, 13, 17, 21, 25] } });
      expect(entry.row).toMatchObject({ dimsN: 64, dxUm: 0.35, cflFill: 0.05,
        seedRadius: 2, seedThickness: 1, pressurePa: 101325, maxSteps: 20000 });
      expect(Object.isFrozen(entry.row)).toBe(true);
      expect(Object.isFrozen(entry.row.spatialSampleExtents)).toBe(true);
      if (cold) expect(entry.row.timelineEvent).toBeUndefined();
      else expect(entry.row.experimentalFacetDips).toBeUndefined();
    }
    expect(HIL_EXPLORATION_OCT10.workerCeilings).toEqual({ HIL: 10 });
    expect(() => namedBatchRows(HIL_EXPLORATION_OCT10, "BLD")).toThrow("not assigned");
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
  });

  it("preserves the original supplement binding and refuses cross-batch or changed resume identity", () => {
    const supplement = hilSupplementCampaignBinding();
    expect(supplement).toEqual({
      schema: "hil-supplement-campaign-v1", batchId: HIL_SUPPLEMENT.id,
      checkpointFormat: "discovery-resume-v1", host: "HIL", gitHead: batchGitHead(),
      node: process.version, v8: process.versions.v8, hostIdentity: batchHostIdentity(),
      rosterSha256: firstBatchRosterSha256("HIL", HIL_SUPPLEMENT), requestedConcurrency: 8,
      rows: HIL_SUPPLEMENT_ROWS.map(({ row }) => row),
    });
    const campaign = hilExplorationOct10CampaignBinding();
    expect(() => validateHilExplorationOct10Campaign(campaign)).not.toThrow();
    expect(campaign).toMatchObject({ schema: "hil-exploration-oct10-campaign-v1", requestedConcurrency: 10,
      batchId: HIL_EXPLORATION_OCT10.id, rows: HIL_EXPLORATION_OCT10_ROWS.map(({ row }) => row) });
    expect(() => validateHilExplorationOct10Campaign(supplement)).toThrow("does not match");
    expect(() => validateHilSupplementCampaign(campaign)).toThrow("does not match");
    for (const mutation of [
      { batchId: "other" }, { checkpointFormat: "old" }, { host: "BLD" }, { gitHead: "different" },
      { node: "different" }, { v8: "different" }, { requestedConcurrency: 8 },
      { hostIdentity: { ...campaign.hostIdentity, hostname: "other-computer" } },
      { rosterSha256: "wrong" }, { rows: campaign.rows.slice(1) },
      { rows: [{ ...campaign.rows[0], targetExtent: 31 }, ...campaign.rows.slice(1)] },
    ]) expect(() => validateHilExplorationOct10Campaign({ ...campaign, ...mutation })).toThrow("does not match");
    expect(() => validateHilExplorationOct10Campaign(null)).toThrow("missing");
  });

  it("routes the executable list and checkpointed workers to this roster without a probe route", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout)).toMatchObject({ batchId: HIL_EXPLORATION_OCT10.id, host: "HIL", workerCeiling: 10 });
    expect(JSON.parse(listed.stdout).entries).toEqual(HIL_EXPLORATION_OCT10_ROWS);
    expect(cli("list", "BLD").stderr).toContain("not assigned");
    expect(cli("launch", "BLD", "unused-output").stderr).toContain("assigned only to HIL");
    expect(cli("probe", "HIL", "unused-output").status).toBe(1);
    for (const command of ["run-row", "resume-row"]) {
      const unknown = cli(command, HIL_SUPPLEMENT_ROWS[0].row.id, "unused-output");
      expect(unknown.status).toBe(1);
      expect(unknown.stderr).toContain(`unknown ${HIL_EXPLORATION_OCT10.id} row`);
      const output = directory();
      writeFileSync(join(output, "spec.json"), JSON.stringify({ row: { id: "different" } }));
      const routed = cli(command, HIL_EXPLORATION_OCT10_ROWS[0].row.id, output);
      expect(routed.status).toBe(1);
      expect(routed.stderr).toContain(command === "run-row" ? "output already exists" : "resume row spec mismatch");
    }
  });
});
