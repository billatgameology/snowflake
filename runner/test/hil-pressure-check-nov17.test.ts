import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilOperationalWorkers } from "../src/hil-operational-batch-main.ts";
import { validateDiscoveryRetainedObservations } from "../src/discovery-retained-observations.ts";
import * as discovery from "../src/post-phase10-discovery.ts";
import { PRESSURE_CHECK_CONFIG, pressureCheckCampaignBinding, validatePressureCheckCampaign,
  runPressureCheckBatch } from "../src/hil-pressure-check-nov17-main.ts";
import { HIL_PRESSURE_CHECK_NOV17 as batch, HIL_PRESSURE_CHECK_NOV17_ROWS as entries,
  pressureCheckObservations } from "../src/hil-pressure-check-nov17-roster.ts";

describe("HIL November17 pressure check", () => {
  it("covers the complete two cohorts once in registered order without rerunning controls", () => {
    const expected = [
      ["a-t4p5-f0p05-s8-phalf", -4.5, .05, 8, 50662.5, 3, .00625],
      ["a-t4p5-f0p05-s8-pdouble", -4.5, .05, 8, 202650, 3, .00625],
      ["a-t4p5-f0p1-s3-phalf", -4.5, .10, 3, 50662.5, 3, .00625],
      ["a-t4p5-f0p1-s3-pdouble", -4.5, .10, 3, 202650, 3, .00625],
      ["a-t5-f0p05-s8-phalf", -5, .05, 8, 50662.5, 3, .00625],
      ["a-t5-f0p05-s8-pdouble", -5, .05, 8, 202650, 3, .00625],
      ["a-t5-f0p1-s3-phalf", -5, .10, 3, 50662.5, 3, .00625],
      ["a-t5-f0p1-s3-pdouble", -5, .10, 3, 202650, 3, .00625],
      ["b-t4p5-f0p05-s8-phalf", -4.5, .05, 8, 50662.5, 4, .0125],
      ["b-t4p5-f0p05-s8-pdouble", -4.5, .05, 8, 202650, 4, .0125],
      ["b-t4p5-f0p1-s3-phalf", -4.5, .10, 3, 50662.5, 4, .0125],
      ["b-t4p5-f0p1-s3-pdouble", -4.5, .10, 3, 202650, 4, .0125],
      ["b-t5-f0p05-s8-phalf", -5, .05, 8, 50662.5, 4, .0125],
      ["b-t5-f0p05-s8-pdouble", -5, .05, 8, 202650, 4, .0125],
      ["b-t5-f0p1-s3-phalf", -5, .10, 3, 50662.5, 4, .0125],
      ["b-t5-f0p1-s3-pdouble", -5, .10, 3, 202650, 4, .0125],
    ];
    expect(entries.map(({ row }) => [row.id.replace("pc17-hil-", ""), row.tempC, row.fraction,
      row.experimentalBasalWidthHistory?.cutoffSeconds, row.pressurePa,
      row.experimentalBasalWidthCells, row.cflFill])).toEqual(expected);
    expect(new Set(entries.map(({ row }) => row.id)).size).toBe(16);
    expect(entries.every(({ host, track, row }) => host === "HIL" && track === "warm-history" &&
      row.id.startsWith("pc17-hil-"))).toBe(true);
    expect(namedBatchRows(batch, "HIL")).toHaveLength(16);
    expect(() => namedBatchRows(batch, "BLD")).toThrow("not assigned");
  });

  it("keeps fixed science controls and routes all permanent switch observations", () => {
    for (const { row } of entries) {
      const water = row.tempC === -5 ? .05 : .02 + ((-4.5 + 2) / (-5 + 2)) * (.05 - .02);
      expect(row.sigmaInfinity).toBe(water * row.fraction);
      expect(row).toMatchObject({ conditional: false, lane: "cavity-mechanism", paramSet: "M1",
        dimsN: 64, dxUm: .35, seedRadius: 2, seedThickness: 1,
        maxSteps: 100000, targetExtent: 29, spatialSampleExtents: [5, 9, 13, 17, 21, 25],
        experimentalBasalWidthHistory: { mode: "early-only" } });
      expect((row.targetExtent - 1) * row.dxUm).toBeCloseTo(9.8, 14);
      for (const field of ["timelineEvent", "experimentalHoleFilling", "experimentalFacetDips"])
        expect(row).not.toHaveProperty(field);
      const observations = pressureCheckObservations(row);
      expect(observations).toEqual({ ageSeconds: [1, 2, 2.5, 3, 4, 5, 6.5, 7, 7.5, 8, 10, 20],
        widthHistorySwitch: true, centralAttachments: { maxHexRadiusCells: 1, absoluteZOffsets: [1] } });
      expect(() => validateDiscoveryRetainedObservations(observations, row)).not.toThrow();
    }
  });

  it("binds the producer and full roster while limiting this queue to sixteen workers", () => {
    const binding = pressureCheckCampaignBinding();
    expect(binding).toMatchObject({ batchId: "hil-pressure-check-2026-11-17", host: "HIL", workerCeiling: 16, checkpointFormat: "discovery-resume-v1" });
    expect(binding.rows).toHaveLength(16);
    expect(() => validatePressureCheckCampaign(binding)).not.toThrow();
    for (const mutation of [{ batchId: "hil-onset-pressure-2026-11-16" }, { host: "BLD" }, { workerCeiling: 20 }, { rows: [] }, { gitHead: "wrong" }])
      expect(() => validatePressureCheckCampaign({ ...binding, ...mutation })).toThrow("does not match");
    for (const mutation of [{ pressurePa: 101325 }, { cflFill: .0125 }, { experimentalBasalWidthCells: 4 }]) {
      const changedRows = binding.rows.map((row, i) => i === 0 ? { ...row, ...mutation } : row);
      expect(() => validatePressureCheckCampaign({ ...binding, rows: changedRows })).toThrow("rows");
    }
    expect(hilOperationalWorkers([], PRESSURE_CHECK_CONFIG)).toBe(16);
    expect(hilOperationalWorkers(["--workers", "8"], PRESSURE_CHECK_CONFIG)).toBe(8);
    for (const count of ["0", "17", "1.5"])
      expect(() => hilOperationalWorkers(["--workers", count], PRESSURE_CHECK_CONFIG)).toThrow();
  });

  it("routes every row through checkpoint and capture settings for create and resume", async () => {
    const spy = vi.spyOn(discovery, "runPostPhase10DiscoveryRow").mockReturnValue({
      stopReason: "size-target", integrityErrors: [],
    } as unknown as discovery.DiscoveryTerminalResult);
    const oldArgs = process.argv;
    try {
      for (const { row } of entries) for (const command of ["run-row", "resume-row"]) {
        process.argv = [process.execPath, "unused-entry", command, row.id, "unused-output"];
        await runPressureCheckBatch();
        expect(spy).toHaveBeenLastCalledWith(row, "unused-output", {
          checkpoint: command === "run-row" ? "create" : "resume",
          retainedObservations: pressureCheckObservations(row), heartbeat: expect.any(Function),
        });
      }
      expect(spy).toHaveBeenCalledTimes(32);
    } finally { process.argv = oldArgs; spy.mockRestore(); }
  });

  it("exercises the list CLI and rejects other hosts, old rows, extra arguments and probes", () => {
    const cli = (...args: string[]) => spawnSync(process.execPath,
      ["runner/src/hil-pressure-check-nov17-main.ts", ...args], { encoding: "utf8", windowsHide: true });
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).entries).toEqual(entries);
    expect(cli("launch", "BLD", "unused").stderr).toContain("assigned only to HIL");
    expect(cli("launch", "HIL", "unused", "--workers", "17").stderr).toContain("between 1 and 16");
    expect(cli("run-row", "adv12-hil-onset-t4p5-w3-s4p25", "unused").stderr).toContain("unknown pressure check row");
    expect(cli("resume-row", entries[0].row.id, "unused", "extra").stderr).toContain("exactly row ID");
    expect(cli("probe", "HIL", "unused").status).toBe(1);
  });
});
