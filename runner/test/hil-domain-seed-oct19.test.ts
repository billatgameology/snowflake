import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { batchGitHead, batchHostIdentity } from "../src/hil-bld-batch-execution.ts";
import { firstBatchRosterSha256 } from "../src/hil-bld-batch-main.ts";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilDomainSeedOct19CampaignBinding, validateHilDomainSeedOct19Campaign } from "../src/hil-domain-seed-oct19-main.ts";
import { HIL_DOMAIN_SEED_OCT19, HIL_DOMAIN_SEED_OCT19_ROWS } from "../src/hil-domain-seed-oct19-roster.ts";
import { HIL_EXPLORATION_OCT10_ROWS } from "../src/hil-exploration-oct10-roster.ts";
import { HIL_LARGE_BATCH_OCT11_ROWS } from "../src/hil-large-batch-oct11-roster.ts";
import { hilTwoDayOct12CampaignBinding } from "../src/hil-two-day-oct12-main.ts";
import type { DiscoveryRow } from "../src/post-phase10-discovery.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
const cli = (...args: string[]) => spawnSync(process.execPath, ["runner/src/hil-domain-seed-oct19-main.ts", ...args],
  { encoding: "utf8", windowsHide: true });

// Literal ordered cases from the committed protocol, independent of the roster's loops/templates.
const cases = [
  ["cold-domain-t14p4-f0p1-n96-both", -14.4, 0.1, 96, 2, 1, 0.05, "both"],
  ["cold-domain-t14p4-f0p1-n96-neither", -14.4, 0.1, 96, 2, 1, 0.05, "neither"],
  ["cold-domain-t14p4-f0p1-n96-basal-only", -14.4, 0.1, 96, 2, 1, 0.05, "basal-only"],
  ["cold-domain-t14p4-f0p1-n96-prism-only", -14.4, 0.1, 96, 2, 1, 0.05, "prism-only"],
  ["seed-step-t6p5-f0p15-r3-h1-cfl0p025-both", -6.5, 0.15, 64, 3, 1, 0.025, "both"],
  ["seed-step-t6p5-f0p15-r3-h1-cfl0p025-neither", -6.5, 0.15, 64, 3, 1, 0.025, "neither"],
  ["seed-step-t6p5-f0p15-r1-h5-cfl0p025-both", -6.5, 0.15, 64, 1, 5, 0.025, "both"],
  ["seed-step-t6p5-f0p15-r1-h5-cfl0p025-neither", -6.5, 0.15, 64, 1, 5, 0.025, "neither"],
  ["seed-step-t9p5-f0p15-r3-h1-cfl0p025-both", -9.5, 0.15, 64, 3, 1, 0.025, "both"],
  ["seed-step-t9p5-f0p15-r3-h1-cfl0p025-neither", -9.5, 0.15, 64, 3, 1, 0.025, "neither"],
  ["seed-step-t9p5-f0p15-r1-h5-cfl0p025-both", -9.5, 0.15, 64, 1, 5, 0.025, "both"],
  ["seed-step-t9p5-f0p15-r1-h5-cfl0p025-neither", -9.5, 0.15, 64, 1, 5, 0.025, "neither"],
] as const;

describe("registered October 19 HIL domain and seed comparison", () => {
  it("contains exactly the twelve ordered cases in the HIL-only twelve-slot wave", () => {
    expect(HIL_DOMAIN_SEED_OCT19_ROWS.map(({ row }) => row.id)).toEqual(cases.map(([id]) => `oct19-hil-${id}`));
    expect(new Set(HIL_DOMAIN_SEED_OCT19_ROWS.map(({ row }) => row.id)).size).toBe(12);
    expect(HIL_DOMAIN_SEED_OCT19.id).toBe("hil-domain-seed-2026-10-19");
    expect(HIL_DOMAIN_SEED_OCT19.workerCeilings).toEqual({ HIL: 12 });
    expect(namedBatchRows(HIL_DOMAIN_SEED_OCT19, "HIL")).toHaveLength(12);
    expect(() => namedBatchRows(HIL_DOMAIN_SEED_OCT19, "BLD")).toThrow("not assigned");
    expect(Object.isFrozen(HIL_DOMAIN_SEED_OCT19_ROWS)).toBe(true);
    expect(firstBatchRosterSha256("HIL")).toBe("333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b");
    expect(firstBatchRosterSha256("BLD")).toBe("866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be");
  });

  it("matches every registered operand and independently interpolates the forcing anchors", () => {
    for (const [index, [suffix, tempC, fraction, dimsN, seedRadius, seedThickness, cflFill, arm]] of cases.entries()) {
      const cold = index < 4;
      // Table 2.1 anchors: (-10,.102), (-15,.157) for cold; (-5,.05), (-10,.102) for seed.
      const sigmaWater = cold ? 0.102 + ((tempC + 10) / -5) * (0.157 - 0.102)
        : 0.05 + ((tempC + 5) / -5) * (0.102 - 0.05);
      const expected: DiscoveryRow = {
        id: `oct19-hil-${suffix}`, lane: cold ? "cavity-mechanism" : "adaptive-seed", conditional: false,
        tempC, fraction, sigmaInfinity: sigmaWater * fraction, pressurePa: 101325, paramSet: "M1",
        dimsN, dxUm: 0.35, cflFill, seedRadius, seedThickness, experimentalFacetDips: arm,
        targetExtent: 29, maxSteps: 20000, spatialSampleExtents: [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
      };
      const entry = HIL_DOMAIN_SEED_OCT19_ROWS[index];
      expect(entry).toEqual({ host: "HIL", track: cold ? "cold-core-tip" : "seed", row: expected });
      expect(Object.isFrozen(entry)).toBe(true);
      expect(Object.isFrozen(entry.row)).toBe(true);
      expect(Object.isFrozen(entry.row.spatialSampleExtents)).toBe(true);
    }
  });

  it("changes only domain or timestep against the actual retained October 10/11 control rosters", () => {
    for (const { row } of HIL_DOMAIN_SEED_OCT19_ROWS) {
      const cold = row.id.startsWith("oct19-hil-cold-domain-");
      const controlId = cold
        ? row.id.replace("oct19-hil-cold-domain-", "oct10-hil-cold-").replace("-n96-", "-")
        : row.id.replace("oct19-hil-seed-step-", "oct11-hil-seed-").replace("-cfl0p025-", "-");
      const control = (cold ? HIL_EXPLORATION_OCT10_ROWS : HIL_LARGE_BATCH_OCT11_ROWS)
        .find((entry) => entry.row.id === controlId);
      expect(control, controlId).toBeDefined();
      expect(row).toEqual({ ...control!.row, id: row.id, ...(cold ? { dimsN: 96 } : { cflFill: 0.025 }) });
      expect(control!.row.dimsN).toBe(64);
      expect(control!.row.cflFill).toBe(0.05);
    }
  });

  it("binds resume to this roster, source, runtime, host and worker count", () => {
    const campaign = hilDomainSeedOct19CampaignBinding();
    expect(campaign).toEqual({ schema: "hil-domain-seed-oct19-campaign-v1", batchId: HIL_DOMAIN_SEED_OCT19.id,
      checkpointFormat: "discovery-resume-v1", host: "HIL", gitHead: batchGitHead(), node: process.version,
      v8: process.versions.v8, hostIdentity: batchHostIdentity(), requestedConcurrency: 12,
      rosterSha256: firstBatchRosterSha256("HIL", HIL_DOMAIN_SEED_OCT19),
      rows: HIL_DOMAIN_SEED_OCT19_ROWS.map(({ row }) => row) });
    expect(() => validateHilDomainSeedOct19Campaign(campaign)).not.toThrow();
    expect(() => validateHilDomainSeedOct19Campaign(hilTwoDayOct12CampaignBinding())).toThrow("does not match");
    for (const mutation of [{ gitHead: "other" }, { node: "other" }, { v8: "other" }, { host: "BLD" },
      { requestedConcurrency: 14 }, { rosterSha256: "other" }, { rows: campaign.rows.slice(1) },
      { rows: [{ ...campaign.rows[0], dimsN: 64 }, ...campaign.rows.slice(1)] }]) {
      expect(() => validateHilDomainSeedOct19Campaign({ ...campaign, ...mutation })).toThrow("does not match");
    }
  });

  it("routes the real CLI to the finite roster and existing checkpointed worker", () => {
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout)).toMatchObject({ batchId: HIL_DOMAIN_SEED_OCT19.id, workerCeiling: 12 });
    expect(JSON.parse(listed.stdout).entries).toEqual(HIL_DOMAIN_SEED_OCT19_ROWS);
    expect(cli("launch", "BLD", "unused-output").stderr).toContain("assigned only to HIL");
    expect(cli("probe", "HIL", "unused-output").status).toBe(1);
    for (const command of ["run-row", "resume-row"]) {
      expect(cli(command, "oct10-hil-cold-t14p4-f0p1-both", "unused-output").stderr).toContain("unknown");
      const output = mkdtempSync(join(tmpdir(), "vcc-hil-oct19-")); temporary.push(output);
      writeFileSync(join(output, "spec.json"), JSON.stringify({ row: { id: "different" } }));
      const routed = cli(command, HIL_DOMAIN_SEED_OCT19_ROWS[0].row.id, output);
      expect(routed.status).toBe(1);
      expect(routed.stderr).toContain(command === "run-row" ? "output already exists" : "resume row spec mismatch");
    }
  });
});
