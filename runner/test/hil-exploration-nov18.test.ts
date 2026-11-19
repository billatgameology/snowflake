import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilOperationalWorkers } from "../src/hil-operational-batch-main.ts";
import { validateDiscoveryRetainedObservations } from "../src/discovery-retained-observations.ts";
import * as discovery from "../src/post-phase10-discovery.ts";
import { EXPLORATION_CONFIG, explorationCampaignBinding, validateExplorationCampaign,
  runExplorationBatch } from "../src/hil-exploration-nov18-main.ts";
import { HIL_EXPLORATION_NOV18 as batch, HIL_EXPLORATION_NOV18_ROWS as entries,
  explorationObservations } from "../src/hil-exploration-nov18-roster.ts";

type RegisteredRow = discovery.DiscoveryRow & {
  block: string; host: string; track: string; historyMode: "early-only";
  cutoffSeconds: number; durationMultiplier: number;
};
// Committed before implementation; supersaturation uses independent decimal table interpolation.
const registered = JSON.parse(readFileSync(new URL(
  "../../evidence/hil-exploration-2026-11-18/registered-roster.json", import.meta.url), "utf8")) as {
    counts: { a: number; b: number; c: number; d: number; total: number }; rows: RegisteredRow[];
  };

describe("HIL November18 finite exploration queue", () => {
  it("matches every pre-registered operand and interleaved position without duplicate cases", () => {
    expect(registered.counts).toEqual({ a: 48, b: 64, c: 64, d: 16, total: 192 });
    expect(entries).toHaveLength(192);
    for (let index = 0; index < registered.rows.length; index++) {
      const { block, host, track, historyMode, cutoffSeconds, durationMultiplier,
        sigmaInfinity, ...operands } = registered.rows[index];
      const { sigmaInfinity: actualSigma, ...actual } = entries[index].row;
      expect({ host: entries[index].host, track: entries[index].track }).toEqual({ host, track });
      expect(actual).toEqual({ ...operands, spatialSampleExtents: [5, 9, 13, 17, 21, 25],
        experimentalBasalWidthHistory: { mode: historyMode, cutoffSeconds } });
      expect(actualSigma).toBeCloseTo(sigmaInfinity, 14);
      expect(actual.id).toContain(`ex18-hil-${block}-`);
      expect(cutoffSeconds).toBe((actual.fraction === .05 ? 8 : 3) * durationMultiplier);
    }
    expect(new Set(entries.map(({ row }) => row.id)).size).toBe(192);
    expect(new Set(entries.map(({ row: { id: _id, ...operands } }) => JSON.stringify(operands))).size).toBe(192);
    expect(namedBatchRows(batch, "HIL")).toHaveLength(192);
    expect(() => namedBatchRows(batch, "BLD")).toThrow("not assigned");
    expect(entries.slice(0, 16).map(({ row }) => row.id.split("-")[2]))
      .toEqual(["a", "a", "a", "a", "b", "b", "b", "b", "c", "c", "c", "c", "d", "d", "d", "d"]);
  });

  it("keeps scientific controls and permanent observations including taller-seed patches", () => {
    for (const { row } of entries) {
      expect(row).toMatchObject({ conditional: false, lane: "cavity-mechanism", paramSet: "M1",
        dimsN: 64, dxUm: .35, maxSteps: 100000, targetExtent: 29,
        spatialSampleExtents: [5, 9, 13, 17, 21, 25],
        experimentalBasalWidthHistory: { mode: "early-only" } });
      expect((row.targetExtent - 1) * row.dxUm).toBeCloseTo(9.8, 14);
      for (const field of ["timelineEvent", "experimentalHoleFilling", "experimentalFacetDips"])
        expect(row).not.toHaveProperty(field);
      const observations = explorationObservations(row);
      expect(observations).toEqual({ ageSeconds: [1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 6, 8, 10, 12, 16, 20],
        widthHistorySwitch: true, centralAttachments: { maxHexRadiusCells: 1,
          absoluteZOffsets: [row.seedThickness === 3 ? 2 : 1] } });
      expect(() => validateDiscoveryRetainedObservations(observations, row)).not.toThrow();
    }
  });

  it("binds all 192 cases while limiting simultaneous workers to sixteen", () => {
    const binding = explorationCampaignBinding();
    expect(binding).toMatchObject({ batchId: "hil-exploration-2026-11-18", host: "HIL",
      workerCeiling: 16, checkpointFormat: "discovery-resume-v1" });
    expect(binding.rows).toHaveLength(192);
    expect(() => validateExplorationCampaign(binding)).not.toThrow();
    for (const mutation of [{ batchId: "hil-pressure-check-2026-11-17" }, { host: "BLD" },
      { workerCeiling: 20 }, { rows: [] }, { gitHead: "wrong" }])
      expect(() => validateExplorationCampaign({ ...binding, ...mutation })).toThrow("does not match");
    for (const mutation of [{ pressurePa: 101325 }, { cflFill: .00625 },
      { experimentalBasalWidthCells: 4 }, { seedThickness: 3 },
      { experimentalBasalWidthHistory: { mode: "early-only", cutoffSeconds: 8 } }]) {
      const rows = binding.rows.map((row, index) => index === 0 ? { ...row, ...mutation } : row);
      expect(() => validateExplorationCampaign({ ...binding, rows })).toThrow("rows");
    }
    expect(hilOperationalWorkers([], EXPLORATION_CONFIG)).toBe(16);
    expect(hilOperationalWorkers(["--workers", "8"], EXPLORATION_CONFIG)).toBe(8);
    for (const count of ["0", "17", "1.5"])
      expect(() => hilOperationalWorkers(["--workers", count], EXPLORATION_CONFIG)).toThrow();
  });

  it("routes all 384 create/resume calls through retained-state recording", async () => {
    const spy = vi.spyOn(discovery, "runPostPhase10DiscoveryRow").mockReturnValue({
      stopReason: "size-target", integrityErrors: [],
    } as unknown as discovery.DiscoveryTerminalResult);
    const oldArgs = process.argv;
    try {
      for (const { row } of entries) for (const command of ["run-row", "resume-row"]) {
        process.argv = [process.execPath, "unused-entry", command, row.id, "unused-output"];
        await runExplorationBatch();
        expect(spy).toHaveBeenLastCalledWith(row, "unused-output", {
          checkpoint: command === "run-row" ? "create" : "resume",
          retainedObservations: explorationObservations(row), heartbeat: expect.any(Function),
        });
      }
      expect(spy).toHaveBeenCalledTimes(384);
    } finally { process.argv = oldArgs; spy.mockRestore(); }
  });

  it("lists the finite queue and refuses other hosts, old rows, extra arguments and probes", () => {
    const cli = (...args: string[]) => spawnSync(process.execPath,
      ["runner/src/hil-exploration-nov18-main.ts", ...args], { encoding: "utf8", windowsHide: true });
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).entries).toEqual(entries);
    expect(cli("launch", "BLD", "unused").stderr).toContain("assigned only to HIL");
    expect(cli("launch", "HIL", "unused", "--workers", "17").stderr).toContain("between 1 and 16");
    expect(cli("run-row", "pc17-hil-a-t4p5-f0p05-s8-phalf", "unused").stderr)
      .toContain("unknown November18 exploration row");
    expect(cli("resume-row", entries[0].row.id, "unused", "extra").stderr).toContain("exactly row ID");
    expect(cli("probe", "HIL", "unused").status).toBe(1);
  });
});
