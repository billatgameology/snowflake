import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { firstBatchRosterSha256 } from "../src/hil-bld-batch-main.ts";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilExplorationOct10CampaignBinding } from "../src/hil-exploration-oct10-main.ts";
import { hilSupplementCampaignBinding } from "../src/hil-supplement-main.ts";
import { hilLargeBatchOct11CampaignBinding, validateHilLargeBatchOct11Campaign } from "../src/hil-large-batch-oct11-main.ts";
import { HIL_LARGE_BATCH_OCT11, HIL_LARGE_BATCH_OCT11_ROWS } from "../src/hil-large-batch-oct11-roster.ts";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";
import type { DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
function directory() {
  const path = mkdtempSync(join(tmpdir(), "vcc-hil-oct11-"));
  temporary.push(path);
  return path;
}
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-large-batch-oct11-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });
const number = (value: string): number => Number(value.replace("p", "."));

// Literal matched groups from the registered five-block queue, independent of its generation loops.
const expectedGroups = [
  "cold-t11-f0p1", "seed-t6p5-f0p15-r3-h1", "history-t6-to-t14p4-f0p1-e7", "static-t6-f0p1", "cold-step-t14p4-f0p1-cfl0p025",
  "cold-t11-f0p15", "seed-t6p5-f0p15-r1-h5", "history-t6-to-t14p4-f0p1-e11", "static-t6-f0p2", "cold-step-t14p4-f0p1-cfl0p0125",
  "cold-t11-f0p2", "seed-t9p5-f0p15-r3-h1", "history-t6-to-t14p4-f0p1-e15", "static-t14p4-f0p2",
  "cold-t13-f0p1", "seed-t9p5-f0p15-r1-h5", "history-t6-to-t14p4-f0p2-e7",
  "cold-t13-f0p15", "history-t6-to-t14p4-f0p2-e11",
  "cold-t13-f0p2", "history-t6-to-t14p4-f0p2-e15",
  "cold-t16-f0p1", "history-t14p4-to-t6-f0p1-e7",
  "cold-t16-f0p15", "history-t14p4-to-t6-f0p1-e11",
  "cold-t16-f0p2", "history-t14p4-to-t6-f0p1-e15",
  "cold-t20-f0p1", "history-t14p4-to-t6-f0p2-e7",
  "cold-t20-f0p15", "history-t14p4-to-t6-f0p2-e11",
  "cold-t20-f0p2", "history-t14p4-to-t6-f0p2-e15",
];

describe("registered October 11 HIL queue", () => {
  it("contains exactly 102 rows with complete quartets and pairs in the registered interleave", () => {
    const ids = expectedGroups.flatMap((group) =>
      (group.startsWith("history-") || group.startsWith("static-")
        ? ["m1", "nodip"] : ["both", "neither", "basal-only", "prism-only"])
        .map((arm) => `oct11-hil-${group}-${arm}`));
    expect(ids).toHaveLength(102);
    expect(HIL_LARGE_BATCH_OCT11_ROWS.map(({ row }) => row.id)).toEqual(ids);
    expect(new Set(ids).size).toBe(102);
    expect(HIL_LARGE_BATCH_OCT11.workerCeilings).toEqual({ HIL: 12 });
    expect(namedBatchRows(HIL_LARGE_BATCH_OCT11, "HIL")).toHaveLength(102);
    expect(() => namedBatchRows(HIL_LARGE_BATCH_OCT11, "BLD")).toThrow("not assigned");
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
  });

  it("binds every named operand to the exact registered scientific row without extra interventions", () => {
    for (const entry of HIL_LARGE_BATCH_OCT11_ROWS) {
      const { row } = entry;
      const suffix = row.id.slice("oct11-hil-".length);
      const history = /^history-t([\dp]+)-to-t([\dp]+)-f([\dp]+)-e(\d+)-(m1|nodip)$/.exec(suffix);
      const staticRow = /^static-t([\dp]+)-f([\dp]+)-(m1|nodip)$/.exec(suffix);
      const facet = /^(cold|seed|cold-step)-t([\dp]+)-f([\dp]+)(?:-r(\d+)-h(\d+)|-cfl([\dp]+))?-(both|neither|basal-only|prism-only)$/.exec(suffix);
      expect(history !== null || staticRow !== null || facet !== null, row.id).toBe(true);
      const tempC = -number(history?.[1] ?? staticRow?.[1] ?? facet![2]);
      const fraction = number(history?.[3] ?? staticRow?.[2] ?? facet![3]);
      const paramSet = (history?.[5] ?? staticRow?.[3]) === "nodip" ? "M1_NO_DIP_ABLATION" : "M1";
      const expected: DiscoveryRow = {
        id: row.id, lane: history !== null || staticRow !== null ? "followup-history"
          : facet![1] === "seed" ? "adaptive-seed" : "cavity-mechanism",
        conditional: false, tempC, fraction, sigmaInfinity: phase6SigmaWaterFromTable(tempC) * fraction,
        pressurePa: 101325, paramSet, dimsN: 64, dxUm: 0.35,
        cflFill: facet?.[6] === undefined ? 0.05 : number(facet[6]),
        seedRadius: facet?.[4] === undefined ? 2 : number(facet[4]),
        seedThickness: facet?.[5] === undefined ? 1 : number(facet[5]),
        targetExtent: 29, maxSteps: 20000, spatialSampleExtents: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
        ...(facet === null ? {} : { experimentalFacetDips: facet[7] as NonNullable<DiscoveryRow["experimentalFacetDips"]> }),
        ...(history === null ? {} : { timelineEvent: { triggerLargestExtent: number(history[4]),
          tempC: -number(history[2]), sigmaInfinity: phase6SigmaWaterFromTable(-number(history[2])) * fraction } }),
      };
      expect(entry).toEqual({ host: "HIL", track: history !== null || staticRow !== null
        ? "environment-history" : facet![1] === "seed" ? "seed" : "cold-core-tip", row: expected });
      expect(Object.isFrozen(entry)).toBe(true);
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.spatialSampleExtents)).toBe(true);
      if (history !== null) expect(Object.isFrozen(row.timelineEvent)).toBe(true);
    }
  });

  it("refuses a changed campaign binding and either earlier batch's resume identity", () => {
    const campaign = hilLargeBatchOct11CampaignBinding();
    expect(campaign).toEqual({
      schema: "hil-large-batch-oct11-campaign-v1", batchId: HIL_LARGE_BATCH_OCT11.id,
      checkpointFormat: "discovery-resume-v1", host: "HIL", gitHead: batchGitHead(),
      node: process.version, v8: process.versions.v8, hostIdentity: batchHostIdentity(),
      rosterSha256: firstBatchRosterSha256("HIL", HIL_LARGE_BATCH_OCT11), requestedConcurrency: 12,
      rows: HIL_LARGE_BATCH_OCT11_ROWS.map(({ row }) => row),
    });
    expect(() => validateHilLargeBatchOct11Campaign(campaign)).not.toThrow();
    for (const earlier of [hilSupplementCampaignBinding(), hilExplorationOct10CampaignBinding()]) {
      expect(() => validateHilLargeBatchOct11Campaign(earlier)).toThrow("does not match");
    }
    for (const mutation of [
      { schema: "other" }, { batchId: "other" }, { checkpointFormat: "old" }, { host: "BLD" },
      { gitHead: "different" }, { node: "different" }, { v8: "different" }, { requestedConcurrency: 16 },
      { hostIdentity: { ...campaign.hostIdentity, hostname: "other-computer" } }, { rosterSha256: "wrong" },
      { rows: campaign.rows.slice(1) },
      { rows: [{ ...campaign.rows[0], targetExtent: 31 }, ...campaign.rows.slice(1)] },
    ]) expect(() => validateHilLargeBatchOct11Campaign({ ...campaign, ...mutation })).toThrow("does not match");
    expect(() => validateHilLargeBatchOct11Campaign(null)).toThrow("missing");
  });

  it("routes the executable list and checkpointed workers to this roster without a probe route", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout)).toMatchObject({ batchId: HIL_LARGE_BATCH_OCT11.id, host: "HIL", workerCeiling: 12 });
    expect(JSON.parse(listed.stdout).entries).toEqual(HIL_LARGE_BATCH_OCT11_ROWS);
    expect(cli("list", "BLD").stderr).toContain("not assigned");
    expect(cli("launch", "BLD", "unused-output").stderr).toContain("assigned only to HIL");
    expect(cli("probe", "HIL", "unused-output").status).toBe(1);
    for (const command of ["run-row", "resume-row"]) {
      const unknown = cli(command, "oct10-hil-cold-t14p4-f0p1-both", "unused-output");
      expect(unknown.status).toBe(1);
      expect(unknown.stderr).toContain(`unknown ${HIL_LARGE_BATCH_OCT11.id} row`);
      const output = directory();
      writeFileSync(join(output, "spec.json"), JSON.stringify({ row: { id: "different" } }));
      const routed = cli(command, HIL_LARGE_BATCH_OCT11_ROWS[0].row.id, output);
      expect(routed.status).toBe(1);
      expect(routed.stderr).toContain(command === "run-row" ? "output already exists" : "resume row spec mismatch");
    }
  });
});
