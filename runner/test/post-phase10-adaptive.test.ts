import { describe, expect, it } from "vitest";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";
import {
  ADAPTIVE_FRACTIONS,
  ADAPTIVE_INTERACTION_FRACTIONS,
  ADAPTIVE_INTERACTION_TEMPERATURES_C,
  ADAPTIVE_TEMPERATURES_C,
  POST_PHASE10_ADAPTIVE_ROWS,
  POST_PHASE10_ADAPTIVE_SMOKE_ROWS,
  findPostPhase10AdaptiveRow,
} from "../src/post-phase10-adaptive.ts";

describe("post-Phase-10 adaptive first tranche", () => {
  it("contains the finite 288 + 72 + 72 roster with unique ids", () => {
    expect(ADAPTIVE_TEMPERATURES_C).toHaveLength(24);
    expect(ADAPTIVE_FRACTIONS).toHaveLength(6);
    expect(ADAPTIVE_INTERACTION_TEMPERATURES_C).toHaveLength(6);
    expect(ADAPTIVE_INTERACTION_FRACTIONS).toHaveLength(3);
    expect(POST_PHASE10_ADAPTIVE_ROWS).toHaveLength(432);
    expect(new Set(POST_PHASE10_ADAPTIVE_ROWS.map((row) => row.id)).size).toBe(432);
    expect(POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-map")).toHaveLength(
      288,
    );
    expect(
      POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-pressure"),
    ).toHaveLength(72);
    expect(POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-seed")).toHaveLength(
      72,
    );
  });

  it("derives forcing from the Phase 6 water-relative table and pins the common machinery", () => {
    const selected = findPostPhase10AdaptiveRow("map-t14p4-f0p15-m1");
    expect(selected).toMatchObject({
      lane: "adaptive-map",
      tempC: -14.4,
      fraction: 0.15,
      pressurePa: 101_325,
      paramSet: "M1",
      dimsN: 48,
      dxUm: 0.35,
      cflFill: 0.1,
      seedRadius: 2,
      seedThickness: 1,
      targetExtent: 21,
    });
    expect(selected?.sigmaInfinity).toBe(phase6SigmaWaterFromTable(-14.4) * 0.15);
  });

  it("contains only the two pressure levels and two near-volume-matched seed shapes", () => {
    const pressureRows = POST_PHASE10_ADAPTIVE_ROWS.filter(
      (row) => row.lane === "adaptive-pressure",
    );
    expect([...new Set(pressureRows.map((row) => row.pressurePa))].sort((a, b) => a! - b!)).toEqual([
      50_662.5,
      202_650,
    ]);
    const seedRows = POST_PHASE10_ADAPTIVE_ROWS.filter((row) => row.lane === "adaptive-seed");
    expect(
      [...new Set(seedRows.map((row) => `${row.seedRadius}/${row.seedThickness}`))].sort(),
    ).toEqual(["1/5", "3/1"]);
    expect(seedRows.every((row) => row.pressurePa === 101_325)).toBe(true);
  });

  it("provides two one-cycle smoke rows that exercise both pressure directions", () => {
    expect(POST_PHASE10_ADAPTIVE_SMOKE_ROWS).toHaveLength(2);
    expect(POST_PHASE10_ADAPTIVE_SMOKE_ROWS.map((row) => row.pressurePa)).toEqual([
      50_662.5,
      202_650,
    ]);
    expect(POST_PHASE10_ADAPTIVE_SMOKE_ROWS.every((row) => row.maxSteps === 1)).toBe(true);
  });
});
