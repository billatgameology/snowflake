import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilOperationalWorkers } from "../src/hil-operational-batch-main.ts";
import { CENTRAL_FILLING_CONFIG, centralFillingCampaignBinding, validateCentralFillingCampaign }
  from "../src/hil-central-filling-nov11-main.ts";
import { HIL_CENTRAL_FILLING_NOV11 as batch, HIL_CENTRAL_FILLING_NOV11_ROWS as entries,
  centralFillingObservations } from "../src/hil-central-filling-nov11-roster.ts";

describe("HIL central filling registered wave", () => {
  it("covers each registered matched contrast once, with the expensive and central timing rows first", () => {
    const scientificKeys = entries.map(({ row: r }) => [r.dimsN, r.tempC, r.seedThickness,
      r.experimentalBasalWidthCells, r.experimentalBasalWidthHistory!.cutoffSeconds, r.cflFill].join("/"));
    const expected: string[] = [];
    for (const h of [1, 3]) for (const w of [6, 8]) expected.push([126, -4.5, h, w, 5, .025].join("/"));
    for (const s of [2.25, 2.5, 2.75, 3, 2, 4]) for (const t of [-4.5, -5]) for (const w of [3, 4])
      expected.push([64, t, 1, w, s, .025].join("/"));
    for (const s of [2.25, 2.5, 2.75]) for (const t of [-4.5, -5]) for (const w of [3, 4])
      expected.push([64, t, 1, w, s, .0125].join("/"));
    expect(scientificKeys).toEqual(expected);
    expect(new Set(entries.map(({ row }) => row.id)).size).toBe(40);
    expect(new Set(scientificKeys).size).toBe(40);
    expect(entries.slice(0, 20).filter(({ row }) => row.dimsN === 126)).toHaveLength(4);
    expect(entries.slice(20)).toHaveLength(20);
    expect(namedBatchRows(batch, "HIL")).toHaveLength(40);
    expect(() => namedBatchRows(batch, "BLD")).toThrow("not assigned");
  });

  it("retains exact forcing, scientific endpoints and physical observation-region sizes", () => {
    for (const { row: r } of entries) {
      const coarse = r.dimsN === 64;
      const water = r.tempC === -5 ? .05 : .02 + ((-4.5 + 2) / (-5 + 2)) * (.05 - .02);
      expect(r.sigmaInfinity).toBe(water * .075);
      expect(r).toMatchObject({ paramSet: "M1", pressurePa: 101325, fraction: .075,
        maxSteps: 100000, seedRadius: coarse ? 2 : 4,
        experimentalBasalWidthHistory: { mode: "early-only" } });
      expect((r.targetExtent - 1) * r.dxUm).toBeCloseTo(9.8, 14);
      expect(r.targetExtent).toBeLessThan(.65 * r.dimsN);
      expect(r).not.toHaveProperty("timelineEvent");
      expect(r).not.toHaveProperty("experimentalFacetDips");
      const capture = centralFillingObservations(r);
      expect(capture.ageSeconds).toEqual([1, 2, 2.25, 2.5, 2.75, 3, 4, 5, 10]);
      expect(capture.widthHistorySwitch).toBe(true);
      const region = capture.centralAttachments!;
      let count = 0;
      for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) {
        if (Math.max(Math.abs(x), Math.abs(y), Math.abs(x + y)) <= region.maxHexRadiusCells) count += 2;
      }
      expect(count).toBe(coarse ? 14 : 38);
      expect(region.absoluteZOffsets).toEqual([Math.floor(r.seedThickness / 2) + 1]);
      expect(region.maxHexRadiusCells * r.dxUm).toBeCloseTo(.35, 14);
    }
  });

  it("binds HIL producer and roster while permitting only the requested operational ceiling", () => {
    const binding = centralFillingCampaignBinding();
    expect(binding).toMatchObject({ host: "HIL", workerCeiling: 20, checkpointFormat: "discovery-resume-v1" });
    expect(binding.rows).toHaveLength(40);
    expect(() => validateCentralFillingCampaign(binding)).not.toThrow();
    for (const change of [{ host: "BLD" }, { workerCeiling: 21 }, { rows: [] }, { gitHead: "wrong" }])
      expect(() => validateCentralFillingCampaign({ ...binding, ...change })).toThrow("does not match");
    expect(hilOperationalWorkers([], CENTRAL_FILLING_CONFIG)).toBe(20);
    expect(hilOperationalWorkers(["--workers", "12"], CENTRAL_FILLING_CONFIG)).toBe(12);
    expect(() => hilOperationalWorkers(["--workers", "21"], CENTRAL_FILLING_CONFIG)).toThrow();
  });

  it("routes the real HIL-only entry and rejects wrong rows before creating output", () => {
    const cli = (...args: string[]) => spawnSync(process.execPath,
      ["runner/src/hil-central-filling-nov11-main.ts", ...args], { encoding: "utf8", windowsHide: true });
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).entries).toEqual(entries);
    expect(cli("launch", "BLD", "unused").stderr).toContain("assigned only to HIL");
    expect(cli("launch", "HIL", "unused", "--workers", "21").stderr).toContain("between 1 and 20");
    expect(cli("run-row", "gd21-bld-w1-t4p5-c025-early5-w3", "unused").stderr).toContain("unknown");
    expect(cli("probe", "HIL", "unused").status).toBe(1);
  });
});
