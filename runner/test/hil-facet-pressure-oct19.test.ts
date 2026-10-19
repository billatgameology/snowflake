import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { firstBatchRosterSha256 } from "../src/hil-bld-batch-main.ts";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilDomainSeedOct19CampaignBinding } from "../src/hil-domain-seed-oct19-main.ts";
import { hilFacetPressureOct19CampaignBinding, validateHilFacetPressureOct19Campaign } from "../src/hil-facet-pressure-oct19-main.ts";
import { HIL_FACET_PRESSURE_OCT19, HIL_FACET_PRESSURE_OCT19_ROWS } from "../src/hil-facet-pressure-oct19-roster.ts";
import { HIL_LARGE_BATCH_OCT11_ROWS } from "../src/hil-large-batch-oct11-roster.ts";
import { HIL_TWO_DAY_OCT12_ROWS } from "../src/hil-two-day-oct12-roster.ts";
import type { DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-facet-pressure-oct19-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });

// Literal ordered protocol operands, independent of the roster's cloning and selection loops.
const cases = [
  ["facet-step-t6p5-f0p15-r3-h1-cfl0p025-basal-only", "oct11-hil-seed-t6p5-f0p15-r3-h1-basal-only", -6.5, 0.15, 101325, 3, "basal-only", null],
  ["facet-step-t6p5-f0p15-r3-h1-cfl0p025-prism-only", "oct11-hil-seed-t6p5-f0p15-r3-h1-prism-only", -6.5, 0.15, 101325, 3, "prism-only", null],
  ["facet-step-t9p5-f0p15-r3-h1-cfl0p025-basal-only", "oct11-hil-seed-t9p5-f0p15-r3-h1-basal-only", -9.5, 0.15, 101325, 3, "basal-only", null],
  ["facet-step-t9p5-f0p15-r3-h1-cfl0p025-prism-only", "oct11-hil-seed-t9p5-f0p15-r3-h1-prism-only", -9.5, 0.15, 101325, 3, "prism-only", null],
  ["pressure-step-history-t14p4-to-t6-f0p2-e7-p50662p5-m1-cfl0p025", "oct12-hil-pressure-history-t14p4-to-t6-f0p2-e7-p50662p5-m1", -14.4, 0.2, 50662.5, 2, null, 7],
  ["pressure-step-history-t14p4-to-t6-f0p2-e15-p50662p5-m1-cfl0p025", "oct12-hil-pressure-history-t14p4-to-t6-f0p2-e15-p50662p5-m1", -14.4, 0.2, 50662.5, 2, null, 15],
  ["pressure-step-static-t14p4-f0p2-p50662p5-m1-cfl0p025", "oct12-hil-pressure-static-t14p4-f0p2-p50662p5-m1", -14.4, 0.2, 50662.5, 2, null, null],
  ["pressure-step-static-t6-f0p2-p50662p5-m1-cfl0p025", "oct12-hil-pressure-static-t6-f0p2-p50662p5-m1", -6, 0.2, 50662.5, 2, null, null],
  ["pressure-step-history-t14p4-to-t6-f0p2-e7-p202650-m1-cfl0p025", "oct12-hil-pressure-history-t14p4-to-t6-f0p2-e7-p202650-m1", -14.4, 0.2, 202650, 2, null, 7],
  ["pressure-step-history-t14p4-to-t6-f0p2-e15-p202650-m1-cfl0p025", "oct12-hil-pressure-history-t14p4-to-t6-f0p2-e15-p202650-m1", -14.4, 0.2, 202650, 2, null, 15],
  ["pressure-step-static-t14p4-f0p2-p202650-m1-cfl0p025", "oct12-hil-pressure-static-t14p4-f0p2-p202650-m1", -14.4, 0.2, 202650, 2, null, null],
  ["pressure-step-static-t6-f0p2-p202650-m1-cfl0p025", "oct12-hil-pressure-static-t6-f0p2-p202650-m1", -6, 0.2, 202650, 2, null, null],
] as const;

describe("registered October 19 HIL facet and pressure comparison", () => {
  it("contains exactly the twelve ordered HIL-only cases and twelve slots", () => {
    expect(HIL_FACET_PRESSURE_OCT19_ROWS.map(({ row }) => row.id)).toEqual(cases.map(([id]) => `oct19-hil-${id}`));
    expect(new Set(HIL_FACET_PRESSURE_OCT19_ROWS.map(({ row }) => row.id)).size).toBe(12);
    expect(HIL_FACET_PRESSURE_OCT19.id).toBe("hil-facet-pressure-2026-10-19");
    expect(HIL_FACET_PRESSURE_OCT19.launchPrefix).toBe("hil-facet-pressure-oct19");
    expect(HIL_FACET_PRESSURE_OCT19.workerCeilings).toEqual({ HIL: 12 });
    expect(namedBatchRows(HIL_FACET_PRESSURE_OCT19, "HIL")).toHaveLength(12);
    expect(() => namedBatchRows(HIL_FACET_PRESSURE_OCT19, "BLD")).toThrow("not assigned");
    expect(Object.isFrozen(HIL_FACET_PRESSURE_OCT19_ROWS)).toBe(true);
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
  });

  it("matches every literal operand and independently calculates initial and event forcing", () => {
    for (const [index, [suffix, , tempC, fraction, pressurePa, seedRadius, arm, eventExtent]] of cases.entries()) {
      // Existing water table anchors: (-5,.05), (-10,.102), (-15,.157); no producer interpolation call.
      const sigmaWater = tempC < -10 ? 0.102 + ((tempC + 10) / -5) * (0.157 - 0.102)
        : 0.05 + ((tempC + 5) / -5) * (0.102 - 0.05);
      const expected: DiscoveryRow = {
        id: `oct19-hil-${suffix}`, lane: arm === null ? "followup-history" : "adaptive-seed", conditional: false,
        tempC, fraction, sigmaInfinity: sigmaWater * fraction, pressurePa, paramSet: "M1",
        dimsN: 64, dxUm: 0.35, cflFill: 0.025, seedRadius, seedThickness: 1,
        targetExtent: 29, maxSteps: 20000, spatialSampleExtents: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
        ...(arm === null ? {} : { experimentalFacetDips: arm }),
        ...(eventExtent === null ? {} : { timelineEvent: { triggerLargestExtent: eventExtent,
          tempC: -6, sigmaInfinity: (0.05 + 0.2 * (0.102 - 0.05)) * 0.2 } }),
      };
      const entry = HIL_FACET_PRESSURE_OCT19_ROWS[index];
      expect(entry).toEqual({ host: "HIL", track: arm === null ? "environment-history" : "seed", row: expected });
      expect(Object.isFrozen(entry)).toBe(true);
      expect(Object.isFrozen(entry.row)).toBe(true);
      expect(Object.isFrozen(entry.row.spatialSampleExtents)).toBe(true);
      if (eventExtent !== null) expect(Object.isFrozen(entry.row.timelineEvent)).toBe(true);
    }
  });

  it("changes only ID and CFL against the exact old control entries", () => {
    for (const [index, [, controlId]] of cases.entries()) {
      const control = [...HIL_LARGE_BATCH_OCT11_ROWS, ...HIL_TWO_DAY_OCT12_ROWS]
        .find((entry) => entry.row.id === controlId);
      expect(control, controlId).toBeDefined();
      const entry = HIL_FACET_PRESSURE_OCT19_ROWS[index];
      expect(control!.row.cflFill).toBe(0.05);
      expect(entry).toEqual({ ...control, row: { ...control!.row, id: entry.row.id, cflFill: 0.025 } });
    }
  });

  it("binds resume to the exact roster, source, runtime, host and worker count", () => {
    const campaign = hilFacetPressureOct19CampaignBinding();
    expect(campaign).toEqual({ schema: "hil-facet-pressure-oct19-campaign-v1", batchId: HIL_FACET_PRESSURE_OCT19.id,
      checkpointFormat: "discovery-resume-v1", host: "HIL", gitHead: batchGitHead(), node: process.version,
      v8: process.versions.v8, hostIdentity: batchHostIdentity(), requestedConcurrency: 12,
      rosterSha256: firstBatchRosterSha256("HIL", HIL_FACET_PRESSURE_OCT19),
      rows: HIL_FACET_PRESSURE_OCT19_ROWS.map(({ row }) => row) });
    expect(() => validateHilFacetPressureOct19Campaign(campaign)).not.toThrow();
    expect(() => validateHilFacetPressureOct19Campaign(hilDomainSeedOct19CampaignBinding())).toThrow("does not match");
    for (const mutation of [{ gitHead: "other" }, { node: "other" }, { v8: "other" }, { host: "BLD" },
      { requestedConcurrency: 16 }, { rosterSha256: "other" }, { rows: campaign.rows.slice(1) },
      { rows: [{ ...campaign.rows[0], cflFill: 0.05 }, ...campaign.rows.slice(1)] }]) {
      expect(() => validateHilFacetPressureOct19Campaign({ ...campaign, ...mutation })).toThrow("does not match");
    }
  });

  it("routes the real CLI without starting a scientific case", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout)).toMatchObject({ batchId: HIL_FACET_PRESSURE_OCT19.id, workerCeiling: 12 });
    expect(JSON.parse(listed.stdout).entries).toEqual(HIL_FACET_PRESSURE_OCT19_ROWS);
    expect(cli("launch", "BLD", "unused-output").stderr).toContain("assigned only to HIL");
    expect(cli("probe", "HIL", "unused-output").status).toBe(1);
    for (const command of ["run-row", "resume-row"]) {
      expect(cli(command, cases[0][1], "unused-output").stderr).toContain("unknown");
      const output = mkdtempSync(join(tmpdir(), "vcc-hil-facet-pressure-oct19-")); temporary.push(output);
      writeFileSync(join(output, "spec.json"), JSON.stringify({ row: { id: "different" } }));
      const routed = cli(command, HIL_FACET_PRESSURE_OCT19_ROWS[0].row.id, output);
      expect(routed.status).toBe(1);
      expect(routed.stderr).toContain(command === "run-row" ? "output already exists" : "resume row spec mismatch");
    }
  });
});
