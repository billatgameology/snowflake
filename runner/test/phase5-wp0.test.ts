import { describe, expect, it } from "vitest";
import { canonicalJsonSha256 } from "../src/gate4-evidence.ts";
import {
  FLOAT32_EPSILON,
  FLOAT32_MIN_VALUE,
  FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR,
  PHASE5_AGGREGATE_ARTIFACT_PATHS,
  PHASE5_BUDGETS,
  PHASE5_CHECKPOINT_CONVERSION,
  PHASE5_CRITERIA,
  PHASE5_DECISION_MARGINS,
  PHASE5_EVIDENCE_SCHEMA,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_FIXTURES_SHA256,
  PHASE5_GG_DIRICHLET_LEDGER_POLICY,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_LANE_ARTIFACT_PATHS,
  PHASE5_LANES,
  PHASE5_LK_BOUNDED_TWO_CYCLE_POLICY,
  PHASE5_MEMORY_PLANNING,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_PERFORMANCE,
  PHASE5_TOLERANCES_SHA256,
  classifyPhase5LkF32Convergence,
  float32SmootherDriftAbsLimit,
  phase5Float32OrderedKey,
  phase5Float32UlpDistance,
  phase5FixtureManifest,
  phase5ProtocolManifest,
  phase5ToleranceManifest,
} from "../src/phase5-protocol.ts";
import {
  comparePhase5Arrays,
  phase5ComparisonPasses,
  runPhase5ShadowProbe,
} from "../src/phase5-shadow.ts";

describe("Phase 5 criteria freeze", () => {
  it("pins the exact Windows-only v5 protocol and bounded f32 cycle manifest", () => {
    expect(PHASE5_PROTOCOL).toBe("phase5-gpu-conformance-windows-v5");
    expect(PHASE5_PROTOCOL_SHA256).toBe(
      "bdc61bfe5cb48e9e29f5b79337036d7b23ec11e1677f1657595d00f5e7de91ec",
    );
    expect(PHASE5_FIXTURES_SHA256).toBe(
      "29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512",
    );
    expect(PHASE5_TOLERANCES_SHA256).toBe(
      "d38ec0f7a0096dc297d651cd1b89fb80275edb4098c16545c44274e585c2a09b",
    );
    expect(canonicalJsonSha256(phase5ProtocolManifest())).toBe(PHASE5_PROTOCOL_SHA256);
    expect(canonicalJsonSha256(phase5FixtureManifest())).toBe(PHASE5_FIXTURES_SHA256);
    expect(canonicalJsonSha256(phase5ToleranceManifest())).toBe(
      PHASE5_TOLERANCES_SHA256,
    );
  });

  it("pins ADR 0021's exact period-two and one-ULP acceptance boundary", () => {
    expect(PHASE5_LK_BOUNDED_TWO_CYCLE_POLICY).toEqual({
      id: "exact-period2-one-ulp-v1",
      authority: "ADR-0021",
      convergenceModes: ["fixed-point", "bounded-two-cycle", "incomplete"],
      maximumCurrentStepUlpDistance: 1,
      requiredTwoBackUlpDistance: 0,
      minimumCompletedSweepsAfterMutation: 2,
      requiredForBothOrbitPhases: [
        "fixed-sigma-dirichlet-divergence-when-applicable",
        "smoother-drift-bound",
      ],
      persistentHistoryAcrossSegments: [
        "two-sweep-reference",
        "previous-applicable-dirichlet-divergence-result",
        "previous-smoother-drift-bound-result",
      ],
      resetAfter: [
        "construction-or-import",
        "interface-or-topology-update",
        "timeline-event",
        "other-field-mutation",
      ],
      preservedAcross: ["bounded-submission-segment"],
      rejectedNearMisses: [
        "monotonic-one-ulp-drift",
        "period-three",
        "two-ulp-transition",
        "one-active-cell-two-back-mismatch",
        "stale-history-after-mutation",
        "non-finite-value",
        "either-phase-divergence-failure",
        "either-phase-drift-bound-failure",
      ],
    });
    expect(phase5ToleranceManifest()).toMatchObject({
      lkBoundedTwoCycleMaximumUlpDistance: 1,
      lkBoundedTwoCycleRequiredTwoBackUlpDistance: 0,
    });
    expect(
      phase5Float32UlpDistance(
        0.0018111496465280652,
        0.001811149762943387,
      ),
    ).toBe(1);
    expect(phase5Float32UlpDistance(-0, 0)).toBe(1);
    expect(phase5Float32UlpDistance(-1, -1.0000001192092896)).toBe(1);
    const minimumSubnormal = 2 ** -149;
    expect(phase5Float32UlpDistance(-minimumSubnormal, -0)).toBe(1);
    expect(phase5Float32UlpDistance(0, minimumSubnormal)).toBe(1);
    expect(phase5Float32UlpDistance(-minimumSubnormal, minimumSubnormal)).toBe(3);
    const orderedFiniteValues = [
      -Math.fround(3.4028234663852886e38),
      -1,
      -minimumSubnormal,
      -0,
      0,
      minimumSubnormal,
      1,
      Math.fround(3.4028234663852886e38),
    ];
    const orderedKeys = orderedFiniteValues.map(phase5Float32OrderedKey);
    for (let index = 1; index < orderedKeys.length; index += 1) {
      expect(orderedKeys[index]).toBeGreaterThan(orderedKeys[index - 1]!);
    }
    expect(() => phase5Float32UlpDistance(Number.NaN, 0)).toThrow();
    expect(() => phase5Float32UlpDistance(Number.NEGATIVE_INFINITY, 0)).toThrow();
    expect(() => phase5Float32UlpDistance(Number.POSITIVE_INFINITY, 0)).toThrow();

    const boundedCycle = {
      residual: 5.82076573607537e-8,
      relaxTol: 1e-9,
      farField: "dirichlet" as const,
      divTol: 1e-7,
      currentDivergenceStatus: "finite" as const,
      currentDivergenceResidual: 0,
      previousDivergenceStatus: "finite" as const,
      previousDivergenceResidual: 0,
      completedSweepsAfterMutation: 2,
      maximumCurrentStepUlpDistance: 1,
      maximumTwoBackUlpDistance: 0,
      currentDriftBoundPassed: true,
      previousDriftBoundPassed: true,
    } as const;
    expect(classifyPhase5LkF32Convergence(boundedCycle)).toBe(
      "bounded-two-cycle",
    );
    expect(
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        residual: 0,
        completedSweepsAfterMutation: 1,
        previousDivergenceStatus: "unavailable",
        previousDivergenceResidual: null,
      }),
    ).toBe("fixed-point");
    expect(
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        completedSweepsAfterMutation: 1,
        previousDivergenceStatus: "unavailable",
        previousDivergenceResidual: null,
      }),
    ).toBe("incomplete");
    for (const mutation of [
      { completedSweepsAfterMutation: 1 },
      { maximumCurrentStepUlpDistance: 2 },
      { maximumTwoBackUlpDistance: 1 },
      { currentDivergenceResidual: 1e-7 },
      { previousDivergenceResidual: 1e-7 },
      { currentDriftBoundPassed: false },
      { previousDriftBoundPassed: false },
    ]) {
      expect(
        classifyPhase5LkF32Convergence({
          ...boundedCycle,
          ...mutation,
        }),
      ).toBe("incomplete");
    }
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        residual: Number.NaN,
      }),
    ).toThrow();
    expect(
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        farField: "reflecting",
        currentDivergenceStatus: "not-applicable",
        currentDivergenceResidual: null,
        previousDivergenceStatus: "not-applicable",
        previousDivergenceResidual: null,
      }),
    ).toBe("bounded-two-cycle");
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        farField: "reflecting",
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDivergenceResidual: null,
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDivergenceResidual: Number.NaN,
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDivergenceResidual: Number.NEGATIVE_INFINITY,
      }),
    ).toThrow();
    expect(
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDivergenceResidual: Number.POSITIVE_INFINITY,
        currentDivergenceStatus: "zero-exchange-unconverged",
      }),
    ).toBe("incomplete");
    expect(
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        previousDivergenceResidual: Number.POSITIVE_INFINITY,
        previousDivergenceStatus: "zero-exchange-unconverged",
      }),
    ).toBe("incomplete");
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDivergenceResidual: Number.POSITIVE_INFINITY,
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDivergenceStatus: "zero-exchange-unconverged",
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        farField: "invalid" as never,
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        currentDriftBoundPassed: "false" as never,
      }),
    ).toThrow();
    expect(() =>
      classifyPhase5LkF32Convergence({
        ...boundedCycle,
        previousDriftBoundPassed: 1 as never,
      }),
    ).toThrow();
  });

  it("pins ADR 0019's cancellation-safe G-G Dirichlet ledger meaning", () => {
    expect(PHASE5_GG_DIRICHLET_LEDGER_POLICY).toEqual({
      id: "corrected-mass-invariant-v1",
      authority: "ADR-0019",
      directMeterComparison: "required-diagnostic",
      clampPathWitness: "exact-delta-field-reduction-accumulation",
      clampPathSigns: ["positive", "negative"],
      rejectedMutations: [
        "wrong-sign",
        "wrong-shell-mask",
        "omit-one-delta",
        "scale-deltas",
      ],
      withinLaneInvariant:
        "final-total-mass-bd-minus-dirichlet-meter-vs-initial-total-mass-bd",
      crossLaneInvariant: "cpu-corrected-mass-vs-gpu-corrected-mass",
      blockingTolerance: "phase5-mixed-scalar-v1",
    });
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

  it("pins the authenticated Windows lane, artifact graph, and checkpoint conversion", () => {
    expect(PHASE5_LANES).toEqual([
      {
        id: "windows-d3d12",
        operatingSystem: "windows",
        expectedBackend: "D3D12",
      },
    ]);
    expect(PHASE5_LANES).toHaveLength(1);
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
    expect(PHASE5_CRITERIA).toHaveLength(16);
    expect(PHASE5_CRITERIA).not.toContain("P5-METAL-PROVENANCE");
    expect(PHASE5_CRITERIA).not.toContain("P5-CROSS-BACKEND");
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
    expect(FLOAT32_MIN_VALUE).toBe(2 ** -149);
    expect(FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR).toBe(64);
    expect(float32SmootherDriftAbsLimit(1000, 0)).toBe(0);
    expect(float32SmootherDriftAbsLimit(1000, 0.002)).toBe(
      64 * 1000 * 2 ** -23 * 0.002,
    );
    expect(float32SmootherDriftAbsLimit(1000, FLOAT32_MIN_VALUE)).toBe(
      64 * 1000 * FLOAT32_MIN_VALUE,
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
