import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { phase6SigmaWaterFromTable } from "../src/phase6-protocol.ts";
import {
  POST_PHASE10_FOLLOWUP_MIXED_CONDITIONS,
  POST_PHASE10_FOLLOWUP_ROWS,
  POST_PHASE10_FOLLOWUP_ROW_COUNT,
  findPostPhase10FollowupRow,
} from "../src/post-phase10-followup.ts";
import {
  runPostPhase10DiscoveryRow,
  type DiscoveryRow,
} from "../src/post-phase10-discovery.ts";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("post-Phase-10 follow-up wave 2", () => {
  it("matches the six pre-registered blocks in the finite 134-row roster", () => {
    expect(POST_PHASE10_FOLLOWUP_ROWS).toHaveLength(POST_PHASE10_FOLLOWUP_ROW_COUNT);
    expect(new Set(POST_PHASE10_FOLLOWUP_ROWS.map((row) => row.id)).size).toBe(134);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-seed-timestep"),
    ).toHaveLength(12);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-seed-forcing"),
    ).toHaveLength(16);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-seed-localization"),
    ).toHaveLength(12);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-mixed-timestep"),
    ).toHaveLength(40);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-larger"),
    ).toHaveLength(46);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-history"),
    ).toHaveLength(8);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.every(
        (row) => row.sigmaInfinity === phase6SigmaWaterFromTable(row.tempC) * row.fraction,
      ),
    ).toBe(true);
  });

  it("pins the selected timestep, forcing, localization, and mixed-map conditions", () => {
    expect(findPostPhase10FollowupRow("followup-seed-timestep-t8-f0p15-m1-r3t1")).toMatchObject({
      tempC: -8,
      fraction: 0.15,
      seedRadius: 3,
      seedThickness: 1,
      dimsN: 64,
      targetExtent: 29,
      cflFill: 0.05,
    });
    expect(findPostPhase10FollowupRow("followup-seed-forcing-t9-f0p2-nodip-r1t5")).toMatchObject({
      tempC: -9,
      fraction: 0.2,
      seedRadius: 1,
      seedThickness: 5,
      cflFill: 0.1,
    });
    expect(
      findPostPhase10FollowupRow("followup-seed-localization-t8p5-f0p15-m1-r3t1"),
    ).toMatchObject({ tempC: -8.5, fraction: 0.15, cflFill: 0.1 });

    const selectedMixed = POST_PHASE10_FOLLOWUP_ROWS.filter(
      (row) => row.lane === "followup-mixed-timestep",
    );
    const actualConditions = [
      ...new Set(selectedMixed.map((row) => `${row.tempC}/${row.fraction}`)),
    ].sort();
    const expectedConditions = POST_PHASE10_FOLLOWUP_MIXED_CONDITIONS.flatMap((condition) =>
      condition.fractions.map((fraction) => `${condition.tempC}/${fraction}`),
    ).sort();
    expect(actualConditions).toEqual(expectedConditions);
    expect(
      selectedMixed.every(
        (row) => row.dimsN === 64 && row.targetExtent === 29 && row.cflFill === 0.05,
      ),
    ).toBe(true);
  });

  it("pins the four larger-rung subgroups and the eight directional histories", () => {
    const larger = POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane === "followup-larger");
    expect(larger.filter((row) => row.id.startsWith("followup-larger-seed-"))).toHaveLength(12);
    expect(larger.filter((row) => row.id.startsWith("followup-larger-pressure-"))).toHaveLength(24);
    expect(larger.filter((row) => row.id.startsWith("followup-larger-topology-"))).toHaveLength(6);
    expect(larger.filter((row) => row.id.startsWith("followup-larger-cavity-"))).toHaveLength(4);
    expect(larger.every((row) => row.dimsN === 80 && row.targetExtent === 37)).toBe(true);

    const histories = POST_PHASE10_FOLLOWUP_ROWS.filter(
      (row) => row.lane === "followup-history",
    );
    expect(histories.every((row) => row.dimsN === 64 && row.targetExtent === 29)).toBe(true);
    expect(histories.every((row) => row.timelineEvent?.triggerLargestExtent === 11)).toBe(true);
    expect(
      [...new Set(histories.map((row) => `${row.tempC}->${row.timelineEvent?.tempC}`))].sort(),
    ).toEqual(["-14.4->-6", "-24->-4.5", "-4.5->-24", "-6->-14.4"]);
    expect(
      POST_PHASE10_FOLLOWUP_ROWS.filter((row) => row.lane !== "followup-history").every(
        (row) => row.timelineEvent === undefined,
      ),
    ).toBe(true);
  });

  it("runs one abrupt event at its exact first extent crossing", () => {
    const directory = mkdtempSync(join(tmpdir(), "vcc-post-phase10-followup-"));
    temporaryDirectories.push(directory);
    const candidate: DiscoveryRow = {
      ...(findPostPhase10FollowupRow("followup-history-t4p5-to-t24-m1") as DiscoveryRow),
      id: "followup-history-smoke",
      dimsN: 20,
      cflFill: 0.5,
      seedRadius: 1,
      seedThickness: 1,
      targetExtent: 7,
      maxSteps: 20,
      timelineEvent: {
        triggerLargestExtent: 7,
        tempC: -24,
        sigmaInfinity: phase6SigmaWaterFromTable(-24) * 0.15,
      },
    };
    const measured = runPostPhase10DiscoveryRow(candidate, directory);
    expect(measured.stopReason).toBe("size-target");
    expect(measured.integrityErrors).toEqual([]);
    expect(measured.timeline?.eventLog).toHaveLength(1);
    expect(measured.timeline?.eventCycle).toBe(
      measured.timeline?.eventLog[0].crossingBoundary.completedCycles,
    );
    expect(measured.timeline?.eventLog[0]).toMatchObject({
      trigger: { kind: "largestExtent", value: 7 },
      beforeEnvironment: {
        tempC: -4.5,
        sigmaInfinity: phase6SigmaWaterFromTable(-4.5) * 0.15,
      },
      afterEnvironment: {
        tempC: -24,
        sigmaInfinity: phase6SigmaWaterFromTable(-24) * 0.15,
      },
    });
    expect(measured.timeline?.transitionReport.afterEnvironment.tempC).toBe(-24);
  });

  it("has no resolver path outside the finite roster", () => {
    expect(findPostPhase10FollowupRow("followup-not-a-row")).toBeUndefined();
  });
});
