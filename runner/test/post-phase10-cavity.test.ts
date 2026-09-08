import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";
import {
  POST_PHASE10_CAVITY_ROWS,
  POST_PHASE10_CAVITY_ROW_COUNT,
  findPostPhase10CavityRow,
} from "../src/post-phase10-cavity.ts";
import type { DiscoveryRow } from "../src/post-phase10-discovery.ts";

const CONFIGURATIONS = [
  { tag: "baseline", dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 1, targetExtent: 29 },
  { tag: "seed-thick", dimsN: 64, dxUm: 0.35, seedRadius: 2, seedThickness: 5, targetExtent: 29 },
  { tag: "seed-wide", dimsN: 64, dxUm: 0.35, seedRadius: 3, seedThickness: 1, targetExtent: 29 },
  { tag: "fine-thin", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness: 1, targetExtent: 57 },
  { tag: "fine-thick", dimsN: 126, dxUm: 0.175, seedRadius: 4, seedThickness: 3, targetExtent: 57 },
] as const;

function requiredRow(id: string): DiscoveryRow {
  const row = findPostPhase10CavityRow(id);
  expect(row, id).toBeDefined();
  return row as DiscoveryRow;
}

describe("post-Phase-10 cavity mechanism wave", () => {
  it("contains the exact five configurations crossed with two temperatures and two arms", () => {
    expect(POST_PHASE10_CAVITY_ROWS).toHaveLength(POST_PHASE10_CAVITY_ROW_COUNT);
    expect(POST_PHASE10_CAVITY_ROW_COUNT).toBe(20);
    const expectedIds = CONFIGURATIONS.flatMap(({ tag }) =>
      ["4p5", "5"].flatMap((temperature) =>
        ["m1", "nodip"].map((arm) => `cavity-${tag}-t${temperature}-${arm}`),
      ),
    );
    expect(POST_PHASE10_CAVITY_ROWS.map((row) => row.id).sort()).toEqual(expectedIds.sort());
    expect(new Set(expectedIds).size).toBe(20);

    for (const { tag, ...configuration } of CONFIGURATIONS) {
      for (const tempC of [-4.5, -5]) {
        const temperature = String(-tempC).replace(".", "p");
        for (const arm of ["m1", "nodip"]) {
          expect(requiredRow(`cavity-${tag}-t${temperature}-${arm}`)).toMatchObject({
            ...configuration,
            tempC,
            paramSet: arm === "m1" ? "M1" : "M1_NO_DIP_ABLATION",
            lane: "cavity-mechanism",
            conditional: false,
            fraction: 0.075,
            sigmaInfinity: phase6SigmaWaterFromTable(tempC) * 0.075,
            pressurePa: 101_325,
            cflFill: 0.05,
            maxSteps: 100_000,
          });
        }
      }
    }
    expect(POST_PHASE10_CAVITY_ROWS.every((row) => row.timelineEvent === undefined)).toBe(true);
  });

  it("matches shell and target center spans without pretending seed cell envelopes match", () => {
    const coarse = requiredRow("cavity-baseline-t4p5-m1");
    const fineThin = requiredRow("cavity-fine-thin-t4p5-m1");
    const fineThick = requiredRow("cavity-fine-thick-t4p5-m1");
    for (const fine of [fineThin, fineThick]) {
      expect((fine.dimsN / 2 - 1) * fine.dxUm).toBe((coarse.dimsN / 2 - 1) * coarse.dxUm);
      expect((fine.targetExtent - 1) * fine.dxUm).toBe((coarse.targetExtent - 1) * coarse.dxUm);
      expect(fine.seedRadius * fine.dxUm).toBe(coarse.seedRadius * coarse.dxUm);
      expect(fine.targetExtent * fine.dxUm).not.toBe(coarse.targetExtent * coarse.dxUm);
    }
    expect(fineThin.seedThickness * fineThin.dxUm).toBeLessThan(coarse.seedThickness * coarse.dxUm);
    expect(fineThick.seedThickness * fineThick.dxUm).toBeGreaterThan(coarse.seedThickness * coarse.dxUm);
  });

  it("holds each coarse seed intervention to its one named geometric change", () => {
    const baseline = requiredRow("cavity-baseline-t5-nodip");
    const thick = requiredRow("cavity-seed-thick-t5-nodip");
    const wide = requiredRow("cavity-seed-wide-t5-nodip");
    expect({ ...thick, id: baseline.id, seedThickness: baseline.seedThickness }).toEqual(baseline);
    expect({ ...wide, id: baseline.id, seedRadius: baseline.seedRadius }).toEqual(baseline);
  });

  it("pins sparse pre-update snapshot landmarks at matched physical center spans", () => {
    const coarseExtents = [5, 9, 13, 17, 21, 25];
    const fineExtents = [9, 17, 25, 33, 41, 49];
    for (const row of POST_PHASE10_CAVITY_ROWS) {
      expect(row.spatialSampleExtents).toEqual(row.dimsN === 64 ? coarseExtents : fineExtents);
      expect(row.spatialSampleExtents?.every((extent) => extent < row.targetExtent)).toBe(true);
      expect(row.spatialSampleExtents?.map((extent) => (extent - 1) * row.dxUm)).toEqual(
        coarseExtents.map((extent) => (extent - 1) * 0.35),
      );
    }
    expect(findPostPhase10CavityRow("cavity-unregistered-row")).toBeUndefined();
  });

  it("lists the complete executable roster and rejects a worker request above the maker cap", () => {
    const entry = "runner/src/post-phase10-discovery-main.ts";
    const listed = execFileSync(process.execPath, [entry, "list-cavity"], { encoding: "utf8" });
    expect(JSON.parse(listed)).toEqual(POST_PHASE10_CAVITY_ROWS);
    const rejected = spawnSync(process.execPath, [entry, "launch-cavity", "unused-cavity-output", "29"], {
      encoding: "utf8",
      windowsHide: true,
    });
    expect(rejected.status).toBe(1);
    expect(rejected.stderr).toContain("concurrency must be an integer in [1, 28]");
  });
});
