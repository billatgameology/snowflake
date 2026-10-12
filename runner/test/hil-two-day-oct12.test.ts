import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { firstBatchRosterSha256 } from "../src/hil-bld-batch-main.ts";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilLargeBatchOct11CampaignBinding } from "../src/hil-large-batch-oct11-main.ts";
import { hilTwoDayOct12CampaignBinding, validateHilTwoDayOct12Campaign } from "../src/hil-two-day-oct12-main.ts";
import { HIL_TWO_DAY_OCT12, HIL_TWO_DAY_OCT12_ROWS } from "../src/hil-two-day-oct12-roster.ts";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";
import type { DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-two-day-oct12-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });
const number = (value: string): number => Number(value.replace("p", "."));
const words = (value: string): string[] => value.trim().split(/\s+/);

// Literal condition groups transcribed from the protocol, independent of roster generation operands.
const blocks = [
  words(`cold-tail-t17p5-f0p1 cold-tail-t17p5-f0p15 cold-tail-t17p5-f0p2
    cold-tail-t18p5-f0p1 cold-tail-t18p5-f0p15 cold-tail-t18p5-f0p2
    cold-tail-t19p5-f0p1 cold-tail-t19p5-f0p15 cold-tail-t19p5-f0p2
    cold-tail-t20p5-f0p1 cold-tail-t20p5-f0p15 cold-tail-t20p5-f0p2`),
  words(`seed-t6p5-f0p1-r3-h1 seed-t6p5-f0p1-r1-h5 seed-t6p5-f0p2-r3-h1 seed-t6p5-f0p2-r1-h5
    seed-t9p5-f0p1-r3-h1 seed-t9p5-f0p1-r1-h5 seed-t9p5-f0p2-r3-h1 seed-t9p5-f0p2-r1-h5
    seed-t7p5-f0p15-r3-h1 seed-t7p5-f0p15-r1-h5 seed-t8p5-f0p15-r3-h1 seed-t8p5-f0p15-r1-h5`),
  words(`history-step-t6-to-t14p4-f0p1-e7-cfl0p025 history-step-t6-to-t14p4-f0p1-e11-cfl0p025
    history-step-t6-to-t14p4-f0p1-e15-cfl0p025 history-step-t6-to-t14p4-f0p2-e7-cfl0p025
    history-step-t6-to-t14p4-f0p2-e11-cfl0p025 history-step-t6-to-t14p4-f0p2-e15-cfl0p025
    history-step-t14p4-to-t6-f0p1-e7-cfl0p025 history-step-t14p4-to-t6-f0p1-e11-cfl0p025
    history-step-t14p4-to-t6-f0p1-e15-cfl0p025 history-step-t14p4-to-t6-f0p2-e7-cfl0p025
    history-step-t14p4-to-t6-f0p2-e11-cfl0p025 history-step-t14p4-to-t6-f0p2-e15-cfl0p025`),
  words(`static-step-t6-f0p1-cfl0p025 static-step-t6-f0p2-cfl0p025
    static-step-t14p4-f0p1-cfl0p025 static-step-t14p4-f0p2-cfl0p025`),
  words(`pressure-history-t6-to-t14p4-f0p1-e7-p50662p5 pressure-history-t6-to-t14p4-f0p1-e7-p202650
    pressure-history-t6-to-t14p4-f0p1-e15-p50662p5 pressure-history-t6-to-t14p4-f0p1-e15-p202650
    pressure-history-t6-to-t14p4-f0p2-e7-p50662p5 pressure-history-t6-to-t14p4-f0p2-e7-p202650
    pressure-history-t6-to-t14p4-f0p2-e15-p50662p5 pressure-history-t6-to-t14p4-f0p2-e15-p202650
    pressure-history-t14p4-to-t6-f0p1-e7-p50662p5 pressure-history-t14p4-to-t6-f0p1-e7-p202650
    pressure-history-t14p4-to-t6-f0p1-e15-p50662p5 pressure-history-t14p4-to-t6-f0p1-e15-p202650
    pressure-history-t14p4-to-t6-f0p2-e7-p50662p5 pressure-history-t14p4-to-t6-f0p2-e7-p202650
    pressure-history-t14p4-to-t6-f0p2-e15-p50662p5 pressure-history-t14p4-to-t6-f0p2-e15-p202650`),
  words(`pressure-static-t6-f0p1-p50662p5 pressure-static-t6-f0p1-p202650
    pressure-static-t6-f0p2-p50662p5 pressure-static-t6-f0p2-p202650
    pressure-static-t14p4-f0p1-p50662p5 pressure-static-t14p4-f0p1-p202650
    pressure-static-t14p4-f0p2-p50662p5 pressure-static-t14p4-f0p2-p202650`),
  words(`cold-step-t20-f0p125-cfl0p05 cold-step-t20-f0p1-cfl0p025
    cold-step-t20-f0p125-cfl0p025 cold-step-t20-f0p15-cfl0p025`),
];

describe("registered October 12 HIL wave", () => {
  it("contains all 192 registered comparisons and interleaves complete matched groups", () => {
    const groups: string[] = [];
    for (let i = 0; i < 16; i++) for (const block of blocks) if (block[i] !== undefined) groups.push(block[i]);
    const ids = groups.flatMap((group) => (group.startsWith("cold-") || group.startsWith("seed-")
      ? ["both", "neither", "basal-only", "prism-only"] : ["m1", "nodip"])
      .map((arm) => `oct12-hil-${group}-${arm}`));
    expect(ids).toHaveLength(192);
    expect(new Set(ids).size).toBe(192);
    expect(HIL_TWO_DAY_OCT12_ROWS.map(({ row }) => row.id)).toEqual(ids);
    expect(HIL_TWO_DAY_OCT12.workerCeilings).toEqual({ HIL: 12 });
    expect(namedBatchRows(HIL_TWO_DAY_OCT12, "HIL")).toHaveLength(192);
    expect(() => namedBatchRows(HIL_TWO_DAY_OCT12, "BLD")).toThrow("not assigned");
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
  });

  it("matches every scientific operand, including pressure and temperature-event forcing", () => {
    for (const entry of HIL_TWO_DAY_OCT12_ROWS) {
      const { row } = entry;
      const id = row.id.slice("oct12-hil-".length);
      const history = /^(?:history-step|pressure-history)-t([\dp]+)-to-t([\dp]+)-f([\dp]+)-e(\d+)-(cfl|p)([\dp]+)-(m1|nodip)$/.exec(id);
      const staticRow = /^(?:static-step|pressure-static)-t([\dp]+)-f([\dp]+)-(cfl|p)([\dp]+)-(m1|nodip)$/.exec(id);
      const facet = /^(cold-tail|cold-step|seed)-t([\dp]+)-f([\dp]+)(?:-r(\d+)-h(\d+)|-cfl([\dp]+))?-(both|neither|basal-only|prism-only)$/.exec(id);
      expect(history !== null || staticRow !== null || facet !== null, row.id).toBe(true);
      const tempC = -number(history?.[1] ?? staticRow?.[1] ?? facet![2]);
      const fraction = number(history?.[3] ?? staticRow?.[2] ?? facet![3]);
      const kind = history?.[5] ?? staticRow?.[3];
      const operand = history?.[6] ?? staticRow?.[4];
      const expected: DiscoveryRow = {
        id: row.id, lane: facet === null ? "followup-history" : facet[1] === "seed" ? "adaptive-seed" : "cavity-mechanism",
        conditional: false, tempC, fraction, sigmaInfinity: phase6SigmaWaterFromTable(tempC) * fraction,
        pressurePa: kind === "p" ? number(operand!) : 101325,
        paramSet: (history?.[7] ?? staticRow?.[5]) === "nodip" ? "M1_NO_DIP_ABLATION" : "M1",
        dimsN: 64, dxUm: 0.35, cflFill: kind === "cfl" ? number(operand!)
          : facet?.[6] === undefined ? 0.05 : number(facet[6]),
        seedRadius: facet?.[4] === undefined ? 2 : number(facet[4]),
        seedThickness: facet?.[5] === undefined ? 1 : number(facet[5]),
        targetExtent: 29, maxSteps: 20000, spatialSampleExtents: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
        ...(facet === null ? {} : { experimentalFacetDips: facet[7] as NonNullable<DiscoveryRow["experimentalFacetDips"]> }),
        ...(history === null ? {} : { timelineEvent: { triggerLargestExtent: number(history[4]),
          tempC: -number(history[2]), sigmaInfinity: phase6SigmaWaterFromTable(-number(history[2])) * fraction } }),
      };
      expect(entry).toEqual({ host: "HIL", track: facet === null ? "environment-history"
        : facet[1] === "seed" ? "seed" : "cold-core-tip", row: expected });
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.spatialSampleExtents)).toBe(true);
      if (history !== null) expect(Object.isFrozen(row.timelineEvent)).toBe(true);
    }
  });

  it("binds continuation to this roster and refuses changed source, row, runtime or concurrency", () => {
    const campaign = hilTwoDayOct12CampaignBinding();
    expect(campaign).toEqual({ schema: "hil-two-day-oct12-campaign-v1", batchId: HIL_TWO_DAY_OCT12.id,
      checkpointFormat: "discovery-resume-v1", host: "HIL", gitHead: batchGitHead(), node: process.version,
      v8: process.versions.v8, hostIdentity: batchHostIdentity(), requestedConcurrency: 12,
      rosterSha256: firstBatchRosterSha256("HIL", HIL_TWO_DAY_OCT12), rows: HIL_TWO_DAY_OCT12_ROWS.map(({ row }) => row) });
    expect(() => validateHilTwoDayOct12Campaign(campaign)).not.toThrow();
    expect(() => validateHilTwoDayOct12Campaign(hilLargeBatchOct11CampaignBinding())).toThrow("does not match");
    for (const mutation of [{ gitHead: "other" }, { node: "other" }, { v8: "other" }, { host: "BLD" },
      { requestedConcurrency: 16 }, { rosterSha256: "other" }, { rows: campaign.rows.slice(1) },
      { rows: [{ ...campaign.rows[0], targetExtent: 31 }, ...campaign.rows.slice(1)] }]) {
      expect(() => validateHilTwoDayOct12Campaign({ ...campaign, ...mutation })).toThrow("does not match");
    }
  });

  it("routes the actual CLI to this roster and its existing checkpointed worker", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout)).toMatchObject({ batchId: HIL_TWO_DAY_OCT12.id, workerCeiling: 12 });
    expect(JSON.parse(listed.stdout).entries).toEqual(HIL_TWO_DAY_OCT12_ROWS);
    expect(cli("launch", "BLD", "unused-output").stderr).toContain("assigned only to HIL");
    expect(cli("probe", "HIL", "unused-output").status).toBe(1);
    for (const command of ["run-row", "resume-row"]) {
      expect(cli(command, "oct11-hil-cold-t20-f0p1-both", "unused-output").stderr).toContain("unknown");
      const output = mkdtempSync(join(tmpdir(), "vcc-hil-oct12-")); temporary.push(output);
      writeFileSync(join(output, "spec.json"), JSON.stringify({ row: { id: "different" } }));
      const routed = cli(command, HIL_TWO_DAY_OCT12_ROWS[0].row.id, output);
      expect(routed.status).toBe(1);
      expect(routed.stderr).toContain(command === "run-row" ? "output already exists" : "resume row spec mismatch");
    }
  });
});
