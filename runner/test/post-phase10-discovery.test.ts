import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  POST_PHASE10_DISCOVERY_ROWS,
  POST_PHASE10_INITIAL_ROWS,
  POST_PHASE10_SMOKE_ROWS,
  discoveryA112Eligibility,
  postPhase10DiscoveryRow,
  runPostPhase10DiscoveryRow,
  type DiscoveryTerminalResult,
} from "../src/post-phase10-discovery.ts";
import {
  discoveryTrend,
  firstSustainedDifference,
} from "../src/post-phase10-discovery-analysis.ts";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function result(
  rowId: "a80" | "a96",
  attachedCount: number,
  habitClass: DiscoveryTerminalResult["habitClass"] = "neutral",
  admissible = true,
): DiscoveryTerminalResult {
  return {
    schema: "post-phase10-discovery-result-v1",
    rowId,
    lane: "A",
    stopReason: "size-target",
    admissible,
    habitClass,
    cycles: 1,
    totalSweeps: 1,
    attachedCount,
    seedSites: 1,
    extent: 27,
    aspectRatio: 1,
    symmetryError: 0,
    allAttachmentEventsD6h: true,
    allRelaxationsConverged: true,
    simTimeSeconds: 1,
    wallSeconds: 1,
    peakRssBytes: 1,
    maxKineticFillIncrement: 0.1,
    maxDivergenceResidual: 1e-8,
    maxAbsSmootherDrift: 0,
    smootherDriftAbsLimit: 1e-10,
    minShellInjection: 1,
    minSurfaceExchange: 1,
    fillLedger: 1,
    saturationClippedFill: 0,
    holeFillDeficit: 0,
    holeFillCountTotal: 0,
    integrityErrors: [],
    startedAt: "2026-08-27T00:00:00.000Z",
    finishedAt: "2026-08-27T00:00:01.000Z",
    gitHead: "a".repeat(40),
    node: "v24.13.1",
  };
}

describe("post-Phase-10 discovery roster", () => {
  it("contains 31 unique rows, with only A112 conditional", () => {
    expect(POST_PHASE10_DISCOVERY_ROWS).toHaveLength(31);
    expect(new Set(POST_PHASE10_DISCOVERY_ROWS.map((row) => row.id)).size).toBe(31);
    expect(POST_PHASE10_INITIAL_ROWS).toHaveLength(30);
    expect(POST_PHASE10_DISCOVERY_ROWS.filter((row) => row.conditional).map((row) => row.id)).toEqual([
      "a112",
    ]);
    expect(POST_PHASE10_INITIAL_ROWS.some((row) => row.id === "a112")).toBe(false);
  });

  it("pins the numerical cells and the 24 matched transition rows", () => {
    expect(postPhase10DiscoveryRow("a80")).toMatchObject({
      dimsN: 80,
      cflFill: 0.1,
      seedRadius: 8,
      seedThickness: 17,
    });
    expect(postPhase10DiscoveryRow("b96-c05")).toMatchObject({
      dimsN: 96,
      cflFill: 0.05,
      seedRadius: 8,
      seedThickness: 17,
    });
    expect(postPhase10DiscoveryRow("b96-seed7")).toMatchObject({
      dimsN: 96,
      cflFill: 0.1,
      seedRadius: 7,
      seedThickness: 15,
    });
    const laneC = POST_PHASE10_DISCOVERY_ROWS.filter((row) => row.lane === "C");
    expect(laneC).toHaveLength(24);
    for (const condition of [
      [-5, 0.125, 0.00625],
      [-5, 0.15, 0.0075],
      [-5, 0.2, 0.01],
      [-6, 0.125, 0.00755],
      [-6, 0.15, 0.00906],
      [-6, 0.2, 0.01208],
      [-19, 0.1, 0.02034],
      [-19, 0.125, 0.025425],
      [-19, 0.2, 0.04068],
      [-24, 0.1, 0.0265],
      [-24, 0.125, 0.033125],
      [-24, 0.2, 0.053],
    ] as const) {
      const matched = laneC.filter(
        (row) => row.tempC === condition[0] && row.fraction === condition[1],
      );
      expect(matched.map((row) => row.paramSet).sort()).toEqual([
        "M1",
        "M1_NO_DIP_ABLATION",
      ]);
      expect(matched.every((row) => row.sigmaInfinity === condition[2])).toBe(true);
    }
  });
});

describe("A112 condition", () => {
  it("requires admissible rows, one class, and at most 0.5% attached-count change", () => {
    expect(discoveryA112Eligibility(result("a80", 1000), result("a96", 1005))).toMatchObject({
      eligible: true,
      attachedCountRelativeDifference: 0.005,
    });
    expect(discoveryA112Eligibility(result("a80", 1000), result("a96", 1006)).eligible).toBe(false);
    expect(
      discoveryA112Eligibility(result("a80", 1000, "plate"), result("a96", 1000, "neutral"))
        .eligible,
    ).toBe(false);
    expect(
      discoveryA112Eligibility(result("a80", 1000, "neutral", false), result("a96", 1000))
        .eligible,
    ).toBe(false);
  });
});

describe("row telemetry", () => {
  it("records a converged cycle, boundary facets, attachments, resources, and a final result", () => {
    const directory = mkdtempSync(join(tmpdir(), "vcc-post-phase10-discovery-"));
    temporaryDirectories.push(directory);
    const measured = runPostPhase10DiscoveryRow(POST_PHASE10_SMOKE_ROWS[0], directory);
    expect(measured.stopReason).toBe("size-target");
    expect(measured.cycles).toBe(1);
    expect(measured.allRelaxationsConverged).toBe(true);
    expect(measured.allAttachmentEventsD6h).toBe(true);
    expect(measured.peakRssBytes).toBeGreaterThan(0);
    const lines = readFileSync(join(directory, "events.jsonl"), "utf8").trim().split("\n");
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(event.schema).toBe("post-phase10-discovery-cycle-v1");
    expect(event.boundary).toMatchObject({
      facets: {
        basal: { count: expect.any(Number) },
        prism: { count: expect.any(Number) },
        inhibited: { count: expect.any(Number) },
        rough: { count: expect.any(Number) },
      },
    });
    expect(event.attached).toBeInstanceOf(Array);
    expect(JSON.parse(readFileSync(join(directory, "result.json"), "utf8"))).toEqual(measured);
  });
});

describe("post-hoc trajectory analysis", () => {
  it("finds the first three-checkpoint, same-sign sustained separation", () => {
    const measured = firstSustainedDifference([
      { coordinate: 1, difference: 0.05 },
      { coordinate: 2, difference: 0.12, leftCycle: 3, rightCycle: 4 },
      { coordinate: 3, difference: 0.14 },
      { coordinate: 4, difference: 0.11 },
      { coordinate: 5, difference: -0.2 },
    ]);
    expect(measured).toMatchObject({
      coordinate: 2,
      windowEndCoordinate: 4,
      difference: 0.12,
      sign: "positive",
      leftCycle: 3,
      rightCycle: 4,
    });
  });

  it("classifies monotonic forcing sequences without fitting a law", () => {
    expect(discoveryTrend([1, 0.5, 0.25])).toBe("nonincreasing");
    expect(discoveryTrend([1, 1, 1])).toBe("constant");
    expect(discoveryTrend([1, null, 2])).toBe("incomplete");
    expect(discoveryTrend([1, 3, 2])).toBe("nonmonotonic");
  });
});
