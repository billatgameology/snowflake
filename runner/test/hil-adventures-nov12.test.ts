import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { namedBatchRows } from "../src/hil-bld-batch-roster.ts";
import { hilOperationalWorkers } from "../src/hil-operational-batch-main.ts";
import { validateDiscoveryRetainedObservations } from "../src/discovery-retained-observations.ts";
import * as discovery from "../src/post-phase10-discovery.ts";
import { ADVENTURES_CONFIG, adventuresCampaignBinding, validateAdventuresCampaign, runAdventuresBatch }
  from "../src/hil-adventures-nov12-main.ts";
import { HIL_ADVENTURES_NOV12 as batch, HIL_ADVENTURES_NOV12_ROWS as entries,
  adventureObservations } from "../src/hil-adventures-nov12-roster.ts";

function arm(row: discovery.DiscoveryRow): string {
  return row.experimentalFacetDips ?? (row.paramSet === "M1_NO_DIP_ABLATION" ? "broad"
    : `early${row.experimentalBasalWidthCells}`);
}
function key(row: discovery.DiscoveryRow): string {
  return [row.tempC, row.fraction, row.seedRadius, row.seedThickness, row.pressurePa, arm(row),
    row.experimentalBasalWidthHistory?.cutoffSeconds ?? "static"].join("/");
}

describe("HIL November12 registered adventures", () => {
  it("covers the complete five cohorts once, reuses two controls and starts four questions", () => {
    const expectedOnset = [
      "-4.5/3/4.5", "-4.5/3/4.25", "-4.5/3/4.75", "-4.5/4/4.5", "-4.5/4/4.25", "-4.5/4/4.75",
      "-5/3/4.5", "-5/3/4.25", "-5/3/4.75", "-5/4/4.5", "-5/4/4.25", "-5/4/4.75",
    ].map((value) => { const [t, w, s] = value.split("/"); return `${t}/0.075/2/1/101325/early${w}/${s}`; });
    const expectedWarmSeed = ["-4.5/2/3", "-4.5/3/1", "-5/2/3", "-5/3/1"].flatMap((value) => {
      const [t, r, h] = value.split("/"); return [`${t}/0.075/${r}/${h}/101325/broad/static`,
        `${t}/0.075/${r}/${h}/101325/early3/5`];
    });
    const arms = ["both", "neither", "basal-only", "prism-only"];
    const expectedColdSeed = ["2/3", "3/1"].flatMap((seed) =>
      arms.map((a) => `-14.4/0.1/${seed}/101325/${a}/static`));
    const expectedColdPressure = [50662.5, 202650].flatMap((pressure) =>
      arms.map((a) => `-14.4/0.1/2/1/${pressure}/${a}/static`));
    const expectedForcing = [
      "-4.5/0.05/early3/5", "-4.5/0.05/early4/5", "-4.5/0.1/early3/5", "-4.5/0.1/early4/5",
      "-5/0.05/broad/static", "-5/0.05/early3/5", "-5/0.05/early4/5",
      "-5/0.1/broad/static", "-5/0.1/early3/5", "-5/0.1/early4/5",
    ].map((value) => { const [t, f, a, s] = value.split("/"); return `${t}/${f}/2/1/101325/${a}/${s}`; });
    const groups = [expectedOnset, expectedWarmSeed, expectedColdSeed, expectedColdPressure];
    const expected = [...groups.flatMap((group) => group.slice(0, 4)),
      ...groups.flatMap((group) => group.slice(4)), ...expectedForcing];
    expect(entries.map(({ row }) => key(row))).toEqual(expected);
    expect(new Set(expected).size).toBe(46);
    expect(new Set(entries.map(({ row }) => row.id)).size).toBe(46);
    expect(entries.map(({ row }) => row.id).every((id) => id.startsWith("adv12-hil-"))).toBe(true);
    expect(entries.slice(0, 16).map(({ track }) => track)).toEqual([
      ...Array<string>(4).fill("warm-history"), ...Array<string>(4).fill("seed"),
      ...Array<string>(4).fill("cold-core-tip"), ...Array<string>(4).fill("pressure"),
    ]);
    expect(namedBatchRows(batch, "HIL")).toHaveLength(46);
    expect(() => namedBatchRows(batch, "BLD")).toThrow("not assigned");
    expect(entries.filter(({ row }) => row.id.includes("forcing") && row.tempC === -4.5 &&
      row.paramSet === "M1_NO_DIP_ABLATION")).toHaveLength(0);
  });

  it("keeps fixed science controls and binds only applicable permanent observations", () => {
    for (const { row } of entries) {
      const water = row.tempC === -14.4 ? .102 + ((-14.4 + 10) / (-15 + 10)) * (.157 - .102)
        : row.tempC === -5 ? .05 : .02 + ((-4.5 + 2) / (-5 + 2)) * (.05 - .02);
      expect(row.sigmaInfinity).toBe(water * row.fraction);
      expect(row).toMatchObject({ conditional: false, dimsN: 64, dxUm: .35, cflFill: .025,
        maxSteps: 100000, targetExtent: 29, spatialSampleExtents: [5, 9, 13, 17, 21, 25] });
      expect((row.targetExtent - 1) * row.dxUm).toBeCloseTo(9.8, 14);
      expect(row.targetExtent).toBeLessThan(.65 * row.dimsN);
      expect(row).not.toHaveProperty("timelineEvent");
      expect(row).not.toHaveProperty("experimentalHoleFilling");
      if (row.experimentalBasalWidthCells !== undefined) {
        expect(row.paramSet).toBe("M1");
        expect(row.experimentalBasalWidthHistory?.mode).toBe("early-only");
        expect(row).not.toHaveProperty("experimentalFacetDips");
      } else if (row.experimentalFacetDips !== undefined) expect(row.paramSet).toBe("M1");
      else expect(row.paramSet).toBe("M1_NO_DIP_ABLATION");
      const observations = adventureObservations(row);
      expect(observations.ageSeconds).toEqual([1, 2, 3, 4, 4.25, 4.5, 4.75, 5, 6, 10, 20]);
      expect(observations.widthHistorySwitch).toBe(row.experimentalBasalWidthCells !== undefined);
      expect(observations.centralAttachments).toEqual({ maxHexRadiusCells: 1,
        absoluteZOffsets: [row.seedThickness === 3 ? 2 : 1] });
      expect(() => validateDiscoveryRetainedObservations(observations, row)).not.toThrow();
    }
  });

  it("rejects changed producer/roster and limits this queue to sixteen workers", () => {
    const binding = adventuresCampaignBinding();
    expect(binding).toMatchObject({ host: "HIL", workerCeiling: 16, checkpointFormat: "discovery-resume-v1" });
    expect(binding.rows).toHaveLength(46);
    expect(() => validateAdventuresCampaign(binding)).not.toThrow();
    for (const mutation of [{ host: "BLD" }, { workerCeiling: 20 }, { rows: [] }, { gitHead: "wrong" }])
      expect(() => validateAdventuresCampaign({ ...binding, ...mutation })).toThrow("does not match");
    const changedRows = binding.rows.map((r, i) => i === 0 ? { ...r, targetExtent: 31 } : r);
    expect(() => validateAdventuresCampaign({ ...binding, rows: changedRows })).toThrow("rows");
    expect(hilOperationalWorkers([], ADVENTURES_CONFIG)).toBe(16);
    expect(hilOperationalWorkers(["--workers", "8"], ADVENTURES_CONFIG)).toBe(8);
    for (const count of ["0", "17", "1.5"])
      expect(() => hilOperationalWorkers(["--workers", count], ADVENTURES_CONFIG)).toThrow();
  });

  it("routes width, broad and facet workers through the recorder for create and resume", async () => {
    const spy = vi.spyOn(discovery, "runPostPhase10DiscoveryRow").mockReturnValue({
      stopReason: "size-target", integrityErrors: [],
    } as unknown as discovery.DiscoveryTerminalResult);
    const oldArgs = process.argv;
    try {
      const representatives = [entries[0].row,
        entries.find(({ row }) => row.paramSet === "M1_NO_DIP_ABLATION")!.row,
        entries.find(({ row }) => row.experimentalFacetDips === "prism-only")!.row];
      for (const row of representatives) for (const command of ["run-row", "resume-row"]) {
        process.argv = [process.execPath, "unused-entry", command, row.id, "unused-output"];
        await runAdventuresBatch();
        expect(spy).toHaveBeenLastCalledWith(row, "unused-output", {
          checkpoint: command === "run-row" ? "create" : "resume",
          retainedObservations: adventureObservations(row), heartbeat: expect.any(Function),
        });
      }
      expect(spy).toHaveBeenCalledTimes(6);
    } finally { process.argv = oldArgs; spy.mockRestore(); }
  });

  it("exercises the real list CLI and refuses invalid host, row, argument and probe routes", () => {
    const cli = (...args: string[]) => spawnSync(process.execPath,
      ["runner/src/hil-adventures-nov12-main.ts", ...args], { encoding: "utf8", windowsHide: true });
    const listed = cli("list", "HIL");
    expect(listed.status, listed.stderr).toBe(0);
    expect(JSON.parse(listed.stdout).entries).toEqual(entries);
    expect(cli("launch", "BLD", "unused").stderr).toContain("assigned only to HIL");
    expect(cli("launch", "HIL", "unused", "--workers", "17").stderr).toContain("between 1 and 16");
    expect(cli("run-row", "cf11-hil-c-h1-w6-s5", "unused").stderr).toContain("unknown adventure row");
    expect(cli("resume-row", entries[0].row.id, "unused", "extra").stderr).toContain("exactly row ID");
    expect(cli("probe", "HIL", "unused").status).toBe(1);
  });
});
