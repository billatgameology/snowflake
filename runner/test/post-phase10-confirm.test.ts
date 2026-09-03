import { describe, expect, it } from "vitest";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";
import {
  POST_PHASE10_CONFIRM_ROWS,
  findPostPhase10ConfirmationRow,
} from "../src/post-phase10-confirm.ts";

describe("post-Phase-10 confirmation wave 1", () => {
  it("matches the pre-registered finite 58-row roster", () => {
    expect(POST_PHASE10_CONFIRM_ROWS).toHaveLength(58);
    expect(new Set(POST_PHASE10_CONFIRM_ROWS.map((row) => row.id)).size).toBe(58);
    expect(POST_PHASE10_CONFIRM_ROWS.filter((row) => row.lane === "confirm-seed")).toHaveLength(
      24,
    );
    expect(
      POST_PHASE10_CONFIRM_ROWS.filter((row) => row.lane === "confirm-pressure"),
    ).toHaveLength(24);
    expect(POST_PHASE10_CONFIRM_ROWS.filter((row) => row.lane === "confirm-map")).toHaveLength(
      10,
    );
  });

  it("pins the shared N64/extent-29 machinery and each named control", () => {
    expect(
      POST_PHASE10_CONFIRM_ROWS.every(
        (row) => row.dimsN === 64 && row.targetExtent === 29 && row.dxUm === 0.35,
      ),
    ).toBe(true);
    for (const row of POST_PHASE10_CONFIRM_ROWS) {
      expect(row.sigmaInfinity).toBe(phase6SigmaWaterFromTable(row.tempC) * row.fraction);
    }

    const transition = findPostPhase10ConfirmationRow(
      "confirm-seed-transition-t8-f0p15-m1-r3t1",
    );
    expect(transition).toMatchObject({
      tempC: -8,
      cflFill: 0.1,
      seedRadius: 3,
      seedThickness: 1,
      pressurePa: 101_325,
    });
    const pressure = findPostPhase10ConfirmationRow(
      "confirm-pressure-persistence-cfl-t24-f0p15-nodip-p202650",
    );
    expect(pressure).toMatchObject({
      tempC: -24,
      cflFill: 0.05,
      pressurePa: 202_650,
      seedRadius: 2,
      seedThickness: 1,
    });
    const cavity = findPostPhase10ConfirmationRow("confirm-cavity-cfl-t4p5-f0p075-m1");
    expect(cavity).toMatchObject({ tempC: -4.5, fraction: 0.075, cflFill: 0.05 });
  });

  it("rejects row ids outside the finite roster", () => {
    expect(findPostPhase10ConfirmationRow("confirm-not-a-row")).toBeUndefined();
  });
});
