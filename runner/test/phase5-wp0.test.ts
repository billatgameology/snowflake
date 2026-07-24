import { describe, expect, it } from "vitest";
import { canonicalJsonSha256 } from "../src/gate4-evidence.ts";
import {
  FLOAT32_EPSILON,
  FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR,
  PHASE5_AGGREGATE_ARTIFACT_PATHS,
  PHASE5_BUDGETS,
  PHASE5_CHECKPOINT_CONVERSION,
  PHASE5_CRITERIA,
  PHASE5_CROSS_BACKEND_TOLERANCE_MULTIPLIER,
  PHASE5_DECISION_MARGINS,
  PHASE5_EVIDENCE_SCHEMA,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_FIXTURES_SHA256,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_LANE_ARTIFACT_PATHS,
  PHASE5_LANES,
  PHASE5_MEMORY_PLANNING,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_PERFORMANCE,
  PHASE5_TOLERANCES_SHA256,
  float32SmootherDriftAbsLimit,
  phase5FixtureManifest,
  phase5ProtocolManifest,
  phase5ToleranceManifest,
} from "../src/phase5-protocol.ts";
import {
  comparePhase5Arrays,
  phase5ComparisonPasses,
  runPhase5ShadowProbe,
} from "../src/phase5-shadow.ts";

describe("Phase 5 WP0 criteria freeze", () => {
  it("pins the exact protocol manifest before solver-gpu exists", () => {
    expect(canonicalJsonSha256(phase5ProtocolManifest())).toBe(PHASE5_PROTOCOL_SHA256);
    expect(canonicalJsonSha256(phase5FixtureManifest())).toBe(PHASE5_FIXTURES_SHA256);
    expect(canonicalJsonSha256(phase5ToleranceManifest())).toBe(
      PHASE5_TOLERANCES_SHA256,
    );
  });

  it("uses morphology-shaped dev and preview budgets rather than cube aliases", () => {
    const byId = Object.fromEntries(PHASE5_BUDGETS.map((budget) => [budget.id, budget]));
    expect(byId["dev-plate"].dims).toEqual({ nx: 128, ny: 128, nz: 64 });
    expect(byId["dev-column"].dims).toEqual({ nx: 80, ny: 80, nz: 160 });
    expect(byId["preview-plate"].dims).toEqual({ nx: 400, ny: 400, nz: 50 });
    expect(byId["preview-column"].dims).toEqual({ nx: 160, ny: 160, nz: 320 });
    expect(400 * 400 * 50).toBe(8_000_000);
    expect(160 * 160 * 320).toBe(8_192_000);
    for (const budget of PHASE5_BUDGETS) {
      const { nx, ny, nz } = budget.dims;
      expect(nx === ny && ny === nz).toBe(false);
    }
    expect(PHASE5_MEMORY_PLANNING).toEqual({
      bytesPerCellCeiling: 64,
      nonCellAndTransientBytesCeiling: 256 * 1024 * 1024,
    });
    expect(PHASE5_PERFORMANCE).toMatchObject({
      sampleCount: 30,
      warmupCount: 5,
      p99Method: "nearest-rank-ceil",
      gpuProcessesPerPhysicalAdapter: 1,
      maxSubmissionSegmentMs: 500,
      p99SubmissionSegmentMs: 250,
    });
  });

  it("pins both authenticated lanes, artifact graph, triangle bound, and checkpoint conversion", () => {
    expect(PHASE5_LANES).toEqual([
      {
        id: "windows-d3d12",
        operatingSystem: "windows",
        expectedBackend: "D3D12",
      },
      {
        id: "macos-metal",
        operatingSystem: "macos",
        expectedBackend: "metal",
      },
    ]);
    expect(PHASE5_CROSS_BACKEND_TOLERANCE_MULTIPLIER).toBe(2);
    expect(new Set(PHASE5_LANE_ARTIFACT_PATHS).size).toBe(
      PHASE5_LANE_ARTIFACT_PATHS.length,
    );
    expect(PHASE5_LANE_ARTIFACT_PATHS).toContain(
      "fixtures/<fixture-id>/gpu-export.ckpt",
    );
    expect(PHASE5_AGGREGATE_ARTIFACT_PATHS).toEqual([
      "gate5-report.json",
      "gate5-artifact-index.json",
    ]);
    expect(PHASE5_EVIDENCE_SCHEMA).toMatchObject({
      textEncoding: "utf-8-no-bom",
      binaryEndianness: "little-endian",
      digest: "sha256",
      publication: "atomic-staging-rename",
    });
    expect(PHASE5_CHECKPOINT_CONVERSION).toMatchObject({
      gpuScalarType: "float32",
      cpuCodecScalarType: "float64",
      ggCodecVersion: 1,
      lkCodecVersion: 2,
      wideningOnly: true,
      newWireMeaning: false,
    });
  });

  it("covers both field conditions, both operators, noise, timelines, and non-cubic axes", () => {
    const diffusion = PHASE5_FIXTURES.filter((fixture) => fixture.kind === "diffusion");
    const gg = PHASE5_FIXTURES.filter((fixture) => fixture.kind === "gg");
    const lk = PHASE5_FIXTURES.filter((fixture) => fixture.kind === "lk");
    expect(new Set(diffusion.map((fixture) => fixture.farField))).toEqual(
      new Set(["reflecting", "dirichlet"]),
    );
    expect(new Set(gg.map((fixture) => fixture.farField))).toEqual(
      new Set(["reflecting", "dirichlet"]),
    );
    expect(new Set(lk.map((fixture) => fixture.farField))).toEqual(
      new Set(["reflecting", "dirichlet"]),
    );
    expect(gg.some((fixture) => fixture.noiseEpsilon > 0 && fixture.timeline !== null)).toBe(true);
    expect(lk.some((fixture) => fixture.noiseEpsilon > 0 && fixture.timeline !== null)).toBe(true);
    expect(
      PHASE5_FIXTURES.some(
        (fixture) =>
          fixture.kind !== "stress" &&
          (fixture.dims.nx !== fixture.dims.ny || fixture.dims.ny !== fixture.dims.nz),
      ),
    ).toBe(true);
    expect(
      PHASE5_FIXTURES.filter((fixture) => fixture.kind !== "stress").every(
        (fixture) =>
          fixture.domain === "box" ||
          fixture.domain === "hexPrism",
      ),
    ).toBe(true);
  });

  it("assigns exactly one independently named negative control to every criterion", () => {
    expect(new Set(PHASE5_CRITERIA).size).toBe(PHASE5_CRITERIA.length);
    expect(new Set(PHASE5_NEGATIVE_CONTROLS.map((control) => control.id)).size).toBe(
      PHASE5_NEGATIVE_CONTROLS.length,
    );
    for (const criterion of PHASE5_CRITERIA) {
      expect(
        PHASE5_NEGATIVE_CONTROLS.filter((control) => control.owner === criterion),
        criterion,
      ).toHaveLength(1);
    }
  });

  it("defines an independent operation-count binary32 smoother-drift bound", () => {
    expect(FLOAT32_EPSILON).toBe(2 ** -23);
    expect(FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR).toBe(64);
    expect(float32SmootherDriftAbsLimit(1000, 0)).toBe(0);
    expect(float32SmootherDriftAbsLimit(1000, 0.002)).toBe(
      64 * 1000 * 2 ** -23 * 0.002,
    );
    expect(() => float32SmootherDriftAbsLimit(0, 0.002)).toThrow();
    expect(() => float32SmootherDriftAbsLimit(1, Number.NaN)).toThrow();
  });

  it("uses absolute/RMS checks near zero and relative checks only above the field floor", () => {
    const tolerance = PHASE5_FIELD_TOLERANCES.diffusionD;
    const smallReference = tolerance.relativeDenominatorFloor / 2;
    const smallDifference = tolerance.rms / 2;
    const belowFloor = comparePhase5Arrays(
      [0, smallReference],
      [smallDifference, smallReference + smallDifference],
      tolerance.relativeDenominatorFloor,
    );
    expect(belowFloor.relativeComparedCount).toBe(0);
    expect(belowFloor.maxRelative).toBe(0);
    expect(phase5ComparisonPasses(belowFloor, tolerance)).toBe(true);

    const relativeFailure = comparePhase5Arrays(
      [1],
      [1 + 2 * tolerance.maxRelative],
      tolerance.relativeDenominatorFloor,
    );
    expect(phase5ComparisonPasses(relativeFailure, tolerance)).toBe(false);
  });

  it("keeps blocking attachment decisions farther from thresholds than field tolerance", () => {
    expect(PHASE5_DECISION_MARGINS.ggBoundaryMass).toBe(
      8 * PHASE5_FIELD_TOLERANCES.ggBoundaryMass.maxAbs,
    );
    expect(PHASE5_DECISION_MARGINS.lkFill).toBe(
      8 * PHASE5_FIELD_TOLERANCES.lkFill.maxAbs,
    );
  });

  it("runs the pre-GPU binary32 shadow inside the frozen envelope", () => {
    const report = runPhase5ShadowProbe();
    expect(report.diffusion).toHaveLength(4);
    expect(report.gg).toHaveLength(2);
    expect(report.lk).toHaveLength(3);
    expect(report.kineticsScalar.sampleCount).toBe(516);
    expect(report.kineticsScalar.maxAbs).toBeGreaterThan(0);
    expect(report.allBlockingMeasurementsWithinFrozenTolerance).toBe(true);
    expect(report.gg.every((fixture) => fixture.occupancyMismatchCount === 0)).toBe(true);
    expect(report.gg.every((fixture) => fixture.passesDecisionMargin)).toBe(true);
    expect(report.lk.every((fixture) => fixture.occupancyMismatchCount === 0)).toBe(true);
    expect(
      report.lk.every(
        (fixture) =>
          fixture.passesDecisionMargin &&
          fixture.convergenceClassificationMismatchCount === 0 &&
          fixture.ledgerWithinMixedTolerance,
      ),
    ).toBe(true);
  });
});
