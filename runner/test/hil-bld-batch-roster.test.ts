import { describe, expect, it } from "vitest";
import {
  FIRST_BATCH_ID,
  FIRST_BATCH_PROBE_STEPS,
  FIRST_BATCH_PROBE_WALL_SECONDS,
  FIRST_BATCH_ROWS,
  FIRST_BATCH_WORKER_CEILINGS,
  firstBatchRepresentativeRows,
  firstBatchRows,
  type FirstBatchHost,
} from "../src/hil-bld-batch-roster.ts";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";

const facetArms = ["both", "neither", "basal-only", "prism-only"];

describe("registered HIL/BLD first-batch roster", () => {
  it("partitions the full protocol into disjoint named queues and rejects unknown names", () => {
    expect(FIRST_BATCH_ID).toBe("hil-bld-first-batch-2026-10-07");
    expect(FIRST_BATCH_ROWS).toHaveLength(98);
    expect(firstBatchRows("HIL")).toHaveLength(56);
    expect(firstBatchRows("BLD")).toHaveLength(42);
    expect(new Set(FIRST_BATCH_ROWS.map(({ row }) => row.id)).size).toBe(98);
    expect(FIRST_BATCH_ROWS.filter(({ host }) => host !== "HIL" && host !== "BLD")).toEqual([]);
    for (const host of ["HIL", "BLD"] as const) {
      expect(firstBatchRows(host).every((entry) => entry.host === host)).toBe(true);
      expect(firstBatchRows(host).every(({ row }) => row.id.startsWith(`batch1-${host.toLowerCase()}-`))).toBe(true);
    }
    expect(() => firstBatchRows("OTHER" as FirstBatchHost)).toThrow("unknown first-batch host");
    expect(() => firstBatchRepresentativeRows("hil" as FirstBatchHost)).toThrow("unknown first-batch host");
  });

  it("keeps the common scientific stage and bounded operational probes", () => {
    expect(FIRST_BATCH_WORKER_CEILINGS).toEqual({ HIL: 16, BLD: 28 });
    expect(FIRST_BATCH_PROBE_WALL_SECONDS).toBe(180);
    expect(FIRST_BATCH_PROBE_STEPS).toBe(3);
    for (const { track, row } of FIRST_BATCH_ROWS) {
      expect(row).toMatchObject({ conditional: false, dimsN: 64, dxUm: 0.35, cflFill: 0.05,
        targetExtent: 21, maxSteps: 20_000, spatialSampleExtents: [5, 9, 13, 17] });
      expect(row.sigmaInfinity).toBe(phase6SigmaWaterFromTable(row.tempC) * row.fraction);
      if (track !== "pressure") expect(row.pressurePa).toBe(101_325);
      if (track !== "seed") expect([row.seedRadius, row.seedThickness]).toEqual([2, 1]);
      expect(row).not.toHaveProperty("experimentalHoleFilling");
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.spatialSampleExtents)).toBe(true);
    }
  });

  it("contains every seed/pressure/cold factorial corner exactly once at matched settings", () => {
    const actualSeed = FIRST_BATCH_ROWS.filter(({ track }) => track === "seed").map(({ host, row }) => {
      expect(host).toBe("HIL");
      expect(row.paramSet).toBe("M1");
      return `${row.tempC}/${row.fraction}/${row.seedRadius}/${row.seedThickness}/${row.experimentalFacetDips}`;
    });
    const expectedSeed = [-7, -9].flatMap((tempC) => [[3, 1], [1, 5]].flatMap(([radius, thickness]) =>
      facetArms.map((arm) => `${tempC}/0.15/${radius}/${thickness}/${arm}`)));
    expect(actualSeed.sort()).toEqual(expectedSeed.sort());

    const actualPressure = FIRST_BATCH_ROWS.filter(({ track }) => track === "pressure").map(({ host, row }) => {
      expect(host).toBe("HIL");
      expect(row.paramSet).toBe("M1");
      return `${row.tempC}/${row.fraction}/${row.pressurePa}/${row.experimentalFacetDips}`;
    });
    const expectedPressure = [0.1, 0.15, 0.2].flatMap((fraction) => [50_662.5, 202_650].flatMap((pressure) =>
      facetArms.map((arm) => `-6/${fraction}/${pressure}/${arm}`)));
    expect(actualPressure.sort()).toEqual(expectedPressure.sort());

    const actualCold = FIRST_BATCH_ROWS.filter(({ track }) => track === "cold-core-tip").map(({ host, row }) => {
      expect(host).toBe("BLD");
      expect(row.paramSet).toBe("M1");
      return `${row.tempC}/${row.fraction}/${row.experimentalFacetDips}`;
    });
    const expectedCold = [-12, -14.4, -18].flatMap((tempC) => [0.1, 0.15, 0.2].flatMap((fraction) =>
      facetArms.map((arm) => `${tempC}/${fraction}/${arm}`)));
    expect(actualCold.sort()).toEqual(expectedCold.sort());
  });

  it("pairs all six switch protocols with both ordinary arms and exact static controls", () => {
    const histories = FIRST_BATCH_ROWS.filter(({ track }) => track === "environment-history");
    expect(histories).toHaveLength(16);
    const actual: string[] = [];
    const actualStatic: string[] = [];
    for (const { host, row } of histories) {
      expect(host).toBe("HIL");
      expect(row.fraction).toBe(0.15);
      expect(row).not.toHaveProperty("experimentalFacetDips");
      expect(row).not.toHaveProperty("experimentalBasalWidthCells");
      expect(row).not.toHaveProperty("experimentalBasalWidthHistory");
      if (row.timelineEvent === undefined) {
        actualStatic.push(`${row.tempC}/${row.paramSet}`);
      } else {
        const event = row.timelineEvent;
        expect(event.sigmaInfinity).toBe(phase6SigmaWaterFromTable(event.tempC) * 0.15);
        expect(Object.isFrozen(event)).toBe(true);
        actual.push(`${row.tempC}/${event.tempC}/${event.triggerLargestExtent}/${row.paramSet}`);
      }
    }
    const arms = ["M1", "M1_NO_DIP_ABLATION"];
    const expected = [[-6, -14.4], [-14.4, -6]].flatMap(([from, to]) =>
      [7, 11, 15].flatMap((stage) => arms.map((arm) => `${from}/${to}/${stage}/${arm}`)));
    expect(actual.sort()).toEqual(expected.sort());
    expect(actualStatic.sort()).toEqual([-6, -14.4].flatMap((tempC) => arms.map((arm) => `${tempC}/${arm}`)).sort());
  });

  it("has separate broad/full/early warm preparations and no accidental timeline experiment", () => {
    const warm = FIRST_BATCH_ROWS.filter(({ track }) => track === "warm-history");
    expect(warm).toHaveLength(6);
    for (const tempC of [-4.5, -5]) {
      const group = warm.filter(({ row }) => row.tempC === tempC);
      expect(group).toHaveLength(3);
      const broad = group.find(({ row }) => row.paramSet === "M1_NO_DIP_ABLATION")!.row;
      expect(broad).not.toHaveProperty("experimentalBasalWidthCells");
      expect(broad).not.toHaveProperty("experimentalBasalWidthHistory");
      const selected = group.filter(({ row }) => row.experimentalBasalWidthCells === 3);
      expect(selected).toHaveLength(2);
      expect(selected.every(({ row }) => row.paramSet === "M1")).toBe(true);
      expect(selected.filter(({ row }) => row.experimentalBasalWidthHistory === undefined)).toHaveLength(1);
      expect(selected.filter(({ row }) => row.experimentalBasalWidthHistory !== undefined)[0].row.experimentalBasalWidthHistory)
        .toEqual({ mode: "early-only", cutoffSeconds: 20 });
    }
    for (const { host, row } of warm) {
      expect(host).toBe("BLD");
      expect(row.fraction).toBe(0.075);
      expect(row).not.toHaveProperty("experimentalFacetDips");
      expect(row).not.toHaveProperty("timelineEvent");
    }
  });

  it("supplies multiple tracks early and actual representatives without modifying their rows", () => {
    expect(firstBatchRows("HIL").slice(0, 10).map(({ track }) => track))
      .toEqual([...Array(4).fill("seed"), ...Array(4).fill("pressure"), ...Array(2).fill("environment-history")]);
    expect(firstBatchRows("BLD").slice(0, 7).map(({ track }) => track))
      .toEqual([...Array(4).fill("cold-core-tip"), ...Array(3).fill("warm-history")]);
    for (const host of ["HIL", "BLD"] as const) {
      const representatives = firstBatchRepresentativeRows(host);
      expect(new Set(representatives.map(({ track }) => track)))
        .toEqual(new Set(firstBatchRows(host).map(({ track }) => track)));
      for (const entry of representatives) {
        expect(FIRST_BATCH_ROWS).toContain(entry);
        expect(entry.row.maxSteps).toBe(20_000);
        expect(entry.row.dimsN).toBe(64);
      }
      expect(new Set(representatives.map(({ row }) => row.id)).size).toBe(representatives.length);
      expect(representatives.some(({ row }) => row.experimentalFacetDips === "prism-only")).toBe(true);
    }
    const hil = firstBatchRepresentativeRows("HIL");
    expect(hil.map(({ row }) => row.id)).toEqual([
      "batch1-hil-seed-t7-f0p15-r3t1-basal-only",
      "batch1-hil-seed-t9-f0p15-r1t5-prism-only",
      "batch1-hil-pressure-t6-f0p2-p50662p5-both",
      "batch1-hil-pressure-t6-f0p2-p202650-neither",
      "batch1-hil-history-t6-to-t14p4-e15-m1",
      "batch1-hil-history-t14p4-to-t6-e15-nodip",
    ]);
    expect(firstBatchRepresentativeRows("BLD").map(({ row }) => row.id)).toEqual([
      "batch1-bld-cold-t18-f0p2-both",
      "batch1-bld-cold-t18-f0p2-neither",
      "batch1-bld-cold-t18-f0p2-basal-only",
      "batch1-bld-cold-t18-f0p2-prism-only",
      "batch1-bld-warm-t5-broad",
      "batch1-bld-warm-t5-full",
      "batch1-bld-warm-t5-early",
    ]);
    expect(new Set(hil.filter(({ track }) => track === "seed").map(({ row }) => `${row.seedRadius}/${row.seedThickness}`)))
      .toEqual(new Set(["3/1", "1/5"]));
    expect(new Set(hil.filter(({ track }) => track === "pressure").map(({ row }) => row.pressurePa)))
      .toEqual(new Set([50_662.5, 202_650]));
    expect(hil.some(({ row }) => row.timelineEvent !== undefined)).toBe(true);
    expect(firstBatchRepresentativeRows("BLD").some(({ row }) => row.experimentalBasalWidthHistory?.mode === "early-only"))
      .toBe(true);
  });
});
