import { Buffer } from "node:buffer";
import {
  PHASE5_FIXTURES,
  PHASE5_BUDGETS,
  PHASE5_FIXTURES_SHA256,
  PHASE5_GG_DIRICHLET_LEDGER_POLICY,
  PHASE5_GG_DIRICHLET_LEDGER_WITNESS,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_SCALAR_NON_APPLICABILITY,
  PHASE5_PERFORMANCE,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_REQUIRED_LIMITS,
  PHASE5_TOLERANCES_SHA256,
  phase5FixtureManifest,
  phase5ProtocolManifest,
  phase5ToleranceManifest,
} from "../src/phase5-protocol.ts";
import {
  PHASE5_RAW_EVIDENCE_SCHEMA,
  type Phase5LaneRawEvidence,
} from "../src/gate5-protocol.ts";
import {
  type Phase5LaneCapture,
  type Phase5LaneVerificationHooks,
  type Phase5FieldComparisonEvidence,
  type Phase5SourceHash,
  PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE,
  PHASE5_LK_SWEEP_DIAGNOSTIC_RATIONALE,
  PHASE5_SCIENCE_INVENTORY,
} from "../src/gate5-evidence.ts";
import { sha256Bytes } from "../src/gate4-evidence.ts";

export const TEST_PHASE5_COMMIT = "1".repeat(40);
export const TEST_PHASE5_SOURCE_HASHES: readonly Phase5SourceHash[] = [
  {
    path: "solver-gpu/src/test-source.ts",
    byteLength: 1,
    sha256: sha256Bytes(new Uint8Array([1])),
  },
];

function testFieldEvidence(
  fixture: (typeof PHASE5_FIXTURES)[number],
): readonly Phase5FieldComparisonEvidence[] {
  if (!fixture.blocking) return [];
  const length = fixture.dims.nx * fixture.dims.ny * fixture.dims.nz;
  const value = (
    name: Phase5FieldComparisonEvidence["name"],
    tolerance: Phase5FieldComparisonEvidence["tolerance"],
  ): Phase5FieldComparisonEvidence => ({
    name,
    tolerance,
    length,
    maxAbs: 0,
    rms: 0,
    maxRelative: 0,
    relativeComparedCount: length,
  });
  if (fixture.kind === "lk") {
    return [value("sigma", "lkSigma"), value("f", "lkFill")];
  }
  if (fixture.kind === "gg") {
    return [value("b", "ggBoundaryMass"), value("d", "ggVapor")];
  }
  return [value("d", "diffusionD")];
}

export const TEST_PHASE5_GG_LEDGER_FIXTURE_ID =
  PHASE5_GG_DIRICHLET_LEDGER_WITNESS.meterReduction.fixtureId;

/**
 * Device-emulating helpers for the ADR-0019 ledger. They are written separately from the
 * runner's verifier on purpose: a fixture that called the verifier's own reduction could not
 * show that the verifier reconstructs anything.
 */
function testBinary32Reduction(values: Float32Array): number {
  const lanes = PHASE5_GG_DIRICHLET_LEDGER_WITNESS.reduction.laneCount;
  let level = values;
  while (level.length > 1) {
    const next = new Float32Array(Math.ceil(level.length / lanes));
    for (let group = 0; group < next.length; group++) {
      const window = new Float32Array(lanes);
      window.set(
        level.subarray(
          group * lanes,
          Math.min((group + 1) * lanes, level.length),
        ),
      );
      for (let stride = lanes / 2; stride >= 1; stride /= 2) {
        for (let lane = 0; lane < stride; lane++) {
          window[lane] = Math.fround(window[lane] + window[lane + stride]);
        }
      }
      next[group] = window[0];
    }
    level = next;
  }
  return level[0] ?? 0;
}

function testReductionDispatches(cellCount: number): number {
  const { laneCount, maxWorkgroupsPerDispatch } =
    PHASE5_GG_DIRICHLET_LEDGER_WITNESS.reduction;
  const maxCells = laneCount * maxWorkgroupsPerDispatch;
  let count = cellCount;
  let dispatches = 0;
  while (count > 1) {
    let workgroups = 0;
    for (let base = 0; base < count; base += maxCells) {
      workgroups += Math.ceil(Math.min(maxCells, count - base) / laneCount);
      dispatches++;
    }
    count = workgroups;
  }
  return dispatches;
}

function testBase64(values: Float32Array): string {
  return Buffer.from(
    values.buffer,
    values.byteOffset,
    values.byteLength,
  ).toString("base64");
}

function testGgCycleReport(values: {
  boundaryCount: number;
  attachedTotal: number;
  attachedNow: number;
  holeFillNow: number;
  lastClampDelta: number;
  dirichletMeter: number;
  oldBoundaryCount: number;
}) {
  return { ...values, errorFlags: 0 };
}

function testGgDirichletLedger() {
  const frozen = PHASE5_FIXTURES.find(
    (fixture) => fixture.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID,
  );
  if (frozen === undefined || frozen.kind !== "gg") {
    throw new Error("the frozen G-G Dirichlet ledger fixture is absent");
  }
  const cycleCap = frozen.stop.value;
  if (typeof cycleCap !== "number") {
    throw new Error("the frozen G-G Dirichlet fixture has no numeric cycle cap");
  }
  const cellCount = frozen.dims.nx * frozen.dims.ny * frozen.dims.nz;

  const cycles = [];
  let cpuMeter = 0;
  let gpuMeter = 0;
  let cpuClampDelta = 0;
  let gpuClampDelta = 0;
  for (let cycle = 1; cycle <= cycleCap; cycle++) {
    cpuClampDelta = cycle * 1e-7;
    gpuClampDelta = Math.fround(cpuClampDelta);
    cpuMeter += cpuClampDelta;
    gpuMeter = Math.fround(gpuMeter + gpuClampDelta);
    const oldBoundaryCount = 18 + cycle;
    const boundaryCount = 19 + cycle;
    const attachedTotal = 19 + cycle;
    const attachedNow = 1;
    const holeFillNow = 0;
    cycles.push({
      cycle,
      cpu: {
        clampDelta: cpuClampDelta,
        cumulativeMeter: cpuMeter,
        tick: cycle,
        oldBoundaryCount,
        boundaryCount,
        attachedTotal,
        relaxation: {
          sweeps: 1,
          converged: true,
          residual: null,
          divergenceResidual: null,
          shellClampDiagnostic: cpuClampDelta,
          surfaceExchangeDiagnostic: null,
          smootherDriftDiagnostic: null,
          minLocalSurfaceExchangeDiagnostic: null,
        },
        surface: {
          attachedNow,
          maxKineticFillIncrement: null,
          holeFillCount: holeFillNow,
          deltaTimeSeconds: null,
          stalled: false,
          skippedUnconverged: false,
        },
      },
      gpu: {
        clampDelta: gpuClampDelta,
        cumulativeMeter: gpuMeter,
        tick: cycle,
        report: testGgCycleReport({
          boundaryCount,
          attachedTotal,
          attachedNow,
          holeFillNow,
          lastClampDelta: gpuClampDelta,
          dirichletMeter: gpuMeter,
          oldBoundaryCount,
        }),
      },
    });
  }

  const clampPath = PHASE5_GG_DIRICHLET_LEDGER_WITNESS.clampPath;
  const witnessCellCount =
    clampPath.dims.nx * clampPath.dims.ny * clampPath.dims.nz;
  const clampPathCases = clampPath.cases.map((registered) => {
    const initialValue = Math.fround(registered.initialValue);
    const rho = Math.fround(registered.rho);
    const delta = Math.fround(rho - initialValue);
    const deltas = new Float32Array(witnessCellCount);
    const vapor = new Float32Array(witnessCellCount);
    vapor.fill(initialValue);
    let shellCellCount = 0;
    for (let index = 0; index < witnessCellCount; index++) {
      if (index % clampPath.shellModulus !== clampPath.shellResidue) continue;
      deltas[index] = delta;
      vapor[index] = rho;
      shellCellCount++;
    }
    const reduced = testBinary32Reduction(Float32Array.from(deltas));
    return {
      id: registered.id,
      dims: { ...clampPath.dims },
      cellCount: witnessCellCount,
      shellCellCount,
      initialValue,
      rho,
      observedDeltasBase64: testBase64(deltas),
      observedVaporBase64: testBase64(vapor),
      report: testGgCycleReport({
        boundaryCount: 0,
        attachedTotal: 0,
        attachedNow: 0,
        holeFillNow: 0,
        lastClampDelta: reduced,
        dirichletMeter: reduced,
        oldBoundaryCount: 0,
      }),
    };
  });

  const [firstSpec, secondSpec] =
    PHASE5_GG_DIRICHLET_LEDGER_WITNESS.meterReduction.fields;
  const registeredField = (spec: {
    readonly modulus: number;
    readonly offset: number;
    readonly scale: number;
    readonly bias: number;
  }): Float32Array => {
    const values = new Float32Array(cellCount);
    for (let index = 0; index < cellCount; index++) {
      values[index] = Math.fround(
        (index % spec.modulus - spec.offset) * spec.scale + spec.bias,
      );
    }
    return values;
  };
  const firstReduced = testBinary32Reduction(registeredField(firstSpec));
  const secondReduced = testBinary32Reduction(registeredField(secondSpec));

  const cpuInitialMass = 12.5;
  const gpuInitialMass = 12.5;
  const cpuFinalMass = cpuInitialMass + cpuMeter;
  const gpuFinalMass = gpuInitialMass + gpuMeter;
  return {
    ledger: {
      policy: structuredClone(PHASE5_GG_DIRICHLET_LEDGER_POLICY),
      cycles,
      clampPathWitness: {
        policy: structuredClone(PHASE5_GG_DIRICHLET_LEDGER_POLICY),
        cases: clampPathCases,
      },
      meterReductionWitness: {
        cellCount,
        reductionDispatches: testReductionDispatches(cellCount),
        firstReport: testGgCycleReport({
          boundaryCount: 19,
          attachedTotal: 19,
          attachedNow: 0,
          holeFillNow: 0,
          lastClampDelta: firstReduced,
          dirichletMeter: firstReduced,
          oldBoundaryCount: 19,
        }),
        secondReport: testGgCycleReport({
          boundaryCount: 19,
          attachedTotal: 19,
          attachedNow: 0,
          holeFillNow: 0,
          lastClampDelta: secondReduced,
          dirichletMeter: Math.fround(firstReduced + secondReduced),
          oldBoundaryCount: 19,
        }),
      },
      correctedMassOperands: {
        cpuInitialMass,
        gpuInitialMass,
        cpuFinalMass,
        gpuFinalMass,
        cpuFinalMeter: cpuMeter,
        gpuFinalMeter: gpuMeter,
      },
    },
    scalars: {
      "ledger.total-mass-bd": { cpu: cpuFinalMass, gpu: gpuFinalMass },
      "ledger.dirichlet-meter": { cpu: cpuMeter, gpu: gpuMeter },
      "relaxation.shell-clamp": { cpu: cpuClampDelta, gpu: gpuClampDelta },
    } as Readonly<Record<string, { readonly cpu: number; readonly gpu: number }>>,
  };
}

const TEST_PHASE5_GG_LEDGER = testGgDirichletLedger();

export const TEST_PHASE5_CHECKPOINT_HOOKS: Phase5LaneVerificationHooks = {
  verifyCheckpointPair: (fixture, cpuBytes, gpuBytes) => {
    if (cpuBytes.byteLength === 0 || gpuBytes.byteLength === 0) {
      throw new Error("test checkpoint is empty");
    }
    const measurement = passingPhase5Raw().checkpoints.find(
      (entry) => entry.fixtureId === fixture.id,
    );
    if (measurement === undefined) {
      throw new Error(`missing test checkpoint measurement: ${fixture.id}`);
    }
    return {
      checkpoint: measurement,
      fields: testFieldEvidence(fixture),
    };
  },
};

export function passingPhase5Raw(): Phase5LaneRawEvidence {
  const fixtures = PHASE5_FIXTURES.flatMap((fixture) =>
    !fixture.blocking ? [] : [{
      id: fixture.id,
      kind: fixture.kind,
      blocking: true,
      comparisonFailureCount: 0,
      fieldFailureCount: 0,
      scalarFailureCount: 0,
      decisionFailureCount: 0,
      invariantFailureCount: 0,
      symmetryChecked: true,
      symmetryMismatchCount: 0,
      domainContact: false,
      stopReasonMatch: true,
    }],
  );
  const interactions = PHASE5_PERFORMANCE.previewCases.flatMap((budgetId) =>
    Array.from({ length: PHASE5_PERFORMANCE.sampleCount }, (_, sample) => ({
      budgetId,
      sample,
      editAcknowledgementMs: 10,
      firstValidFrameMs: 20,
      editGeneration: sample + 1,
      acceptedGeneration: sample + 1,
      renderedGeneration: sample + 1,
    })),
  );
  const checkpoints = PHASE5_FIXTURES.flatMap((fixture) =>
    !fixture.blocking ? [] : [{
      fixtureId: fixture.id,
      codec: fixture.kind === "lk" ? "lk-v2" as const : "gg-v1" as const,
      cpuDecodePass: true,
      gpuDecodePass: true,
      occupancyMismatchCount: 0,
      metadataMismatchCount: 0,
      float32RoundTripMismatchCount: 0,
      scalarType: "float32" as const,
      endianness: "little-endian" as const,
    }],
  );
  const readbackRecords = PHASE5_FIXTURES.filter(
    (fixture) => fixture.blocking,
  ).map((fixture, sequence) => ({
    fixtureId: fixture.id,
    purpose: "evidence-snapshot" as const,
    label: `${fixture.id}:evidence-snapshot`,
    generation: sequence + 1,
    byteOffset: 0,
    byteLength: 4,
    sequence,
    sourceId: sequence,
    sourceByteLength: 8,
    fullField: false,
    displayFrame: false,
    displayFrameSequence: null,
    displayFrameLabel: null,
  }));
  return {
    schema: PHASE5_RAW_EVIDENCE_SCHEMA,
    repository: { commit: TEST_PHASE5_COMMIT, clean: true },
    host: {
      platform: "win32",
      release: "10.0.26200",
      architecture: "x64",
      cpu: "AMD Ryzen 7 5700G with Radeon Graphics",
      logicalProcessors: 16,
      totalMemoryBytes: 68_502_585_344,
    },
    runtime: {
      name: PHASE5_HEADLESS_RUNTIME,
      version: PHASE5_HEADLESS_RUNTIME_VERSION,
      product: "Chrome/149.0.7827.55",
      revision: "@3188f8a607ae7e067593be8aab7f02d2451fec07",
      executablePath:
        "C:\\test\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe",
      launchFlags: [
        "--enable-unsafe-webgpu",
        "--enable-webgpu-developer-features",
      ],
    },
    adapter: {
      vendor: "NVIDIA",
      architecture: "Ampere",
      device: "0x2206",
      description: "NVIDIA GeForce RTX 3080",
      backend: "D3D12",
      type: "discrete GPU",
      driver: "D3D12 driver version 32.0.15.9186",
      features: ["timestamp-query"],
      requestedFeatures: ["timestamp-query"],
      limits: { ...PHASE5_REQUIRED_LIMITS },
      requestedLimits: { ...PHASE5_REQUIRED_LIMITS },
      deviceLimits: { ...PHASE5_REQUIRED_LIMITS },
      budgets: PHASE5_BUDGETS.map((budget) => {
        const requiredBytes =
          budget.dims.nx * budget.dims.ny * budget.dims.nz * 64;
        const supported = budget.disposition === "blocking";
        return {
          id: budget.id,
          disposition: budget.disposition,
          requiredBytes,
          planningCeilingBytes: requiredBytes + 256 * 1024 * 1024,
          supported,
          allocated: supported,
          allocatedBytes: supported ? requiredBytes : null,
          failureReason: supported ? null : "capability-reported budget exceeds test limits",
        };
      }),
    },
    protocol: {
      id: PHASE5_PROTOCOL,
      sha256: PHASE5_PROTOCOL_SHA256,
      fixtureSha256: PHASE5_FIXTURES_SHA256,
      toleranceSha256: PHASE5_TOLERANCES_SHA256,
      manifest: structuredClone(phase5ProtocolManifest()) as never,
      fixtureManifest: structuredClone(phase5FixtureManifest()) as never,
      toleranceManifest: structuredClone(phase5ToleranceManifest()) as never,
    },
    fixtures,
    stressDiagnostics: PHASE5_FIXTURES.flatMap((fixture) =>
      fixture.kind !== "stress"
        ? []
        : [{
            id: fixture.id,
            stress: fixture.stress,
            measurements: { observedCases: 1 },
            pass: true,
          }],
    ),
    submissions: {
      samples: PHASE5_PERFORMANCE.previewCases.flatMap((budgetId) => [
        ...Array.from(
          { length: PHASE5_PERFORMANCE.warmupCount },
          (_, sample) => ({
            budgetId,
            sample,
            warmup: true,
            segmentWallMs: [1],
          }),
        ),
        ...Array.from(
          { length: PHASE5_PERFORMANCE.sampleCount },
          (_, sample) => ({
            budgetId,
            sample,
            warmup: false,
            segmentWallMs: [2],
          }),
        ),
      ]),
      deviceLossCount: 0,
      uncapturedErrorCount: 0,
      hiddenRetryCount: 0,
    },
    interactions,
    readback: {
      records: readbackRecords,
      fullFieldDisplayFrameCount: 0,
      totalBytes: readbackRecords.reduce(
        (sum, entry) => sum + entry.byteLength,
        0,
      ),
    },
    checkpoints,
    toleranceBypassCount: 0,
    negativeControls: PHASE5_NEGATIVE_CONTROLS.map((control) => ({
      id: control.id,
      owner: control.owner,
      mutation: control.mutation,
      rejected: true,
      failedCriteria: [control.owner],
    })),
    publicationVerified: true,
  };
}

export function passingPhase5Capture(): Phase5LaneCapture {
  const raw = passingPhase5Raw();
  return {
    startedAtUtc: "2026-07-24T20:00:00.000Z",
    completedAtUtc: "2026-07-24T20:01:00.000Z",
    raw: { ...raw, publicationVerified: false },
    fixtures: PHASE5_FIXTURES.flatMap((fixture, index) =>
      !fixture.blocking ? [] : [{
        id: fixture.id,
        config: { schema: "phase5-fixture-config-v1", fixture },
        cpuReferenceCheckpoint: new Uint8Array([0x43, index]),
        gpuExportCheckpoint: new Uint8Array([0x47, index]),
        comparison: {
          schema: "phase5-comparison-v1",
          fixtureId: fixture.id,
          fields: testFieldEvidence(fixture),
          scalars: PHASE5_SCIENCE_INVENTORY[fixture.kind].scalars.map(
            (name) => {
              const rationale =
                fixture.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID &&
                  (
                    name === "relaxation.shell-clamp" ||
                    name === "ledger.dirichlet-meter"
                  )
                  ? PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE
                  : fixture.kind === "lk" && name === "relaxation.sweeps"
                    ? PHASE5_LK_SWEEP_DIAGNOSTIC_RATIONALE
                    : null;
              const ledgerScalar =
                fixture.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID
                  ? TEST_PHASE5_GG_LEDGER.scalars[name]
                  : undefined;
              const nonApplicable = Object.hasOwn(
                PHASE5_SCALAR_NON_APPLICABILITY,
                fixture.id,
              ) &&
                Object.hasOwn(
                  (PHASE5_SCALAR_NON_APPLICABILITY as Readonly<
                    Record<string, Readonly<Record<string, string>>>
                  >)[fixture.id],
                  name,
                );
              if (nonApplicable) {
                return {
                  name,
                  cpu: null,
                  gpu: null,
                  blocking: rationale === null,
                  rationale,
                  applicability: "not-applicable" as const,
                };
              }
              return {
                name,
                cpu: ledgerScalar === undefined ? 1 : ledgerScalar.cpu,
                gpu: ledgerScalar === undefined ? 1 : ledgerScalar.gpu,
                blocking: rationale === null,
                rationale,
                applicability: "measured" as const,
              };
            },
          ),
          decisions: PHASE5_SCIENCE_INVENTORY[fixture.kind].decisions.map(
            (name) => ({ name, cpu: { value: name }, gpu: { value: name } }),
          ),
          invariants: PHASE5_SCIENCE_INVENTORY[fixture.kind].invariants.map(
            (name) => ({
              name,
              relation:
                name.includes("margin") ? "greater-or-equal" : "equal",
              left: name.includes("margin") ? 1 : false,
              right: name.includes("margin") ? 0 : false,
              absoluteTolerance: 0,
              relativeTolerance: 0,
            }),
          ),
          checkpoint: structuredClone(
            raw.checkpoints.find(
              (entry) => entry.fixtureId === fixture.id,
            ),
          ),
          ...(fixture.id === TEST_PHASE5_GG_LEDGER_FIXTURE_ID
            ? {
                ggDirichletLedger: structuredClone(
                  TEST_PHASE5_GG_LEDGER.ledger,
                ),
              }
            : {}),
        },
        events: {
          schema: "phase5-events-v1",
          fixtureId: fixture.id,
          records: [
            ...PHASE5_SCIENCE_INVENTORY[fixture.kind].events,
            ...("timeline" in fixture && fixture.timeline !== null
              ? ["timeline-transition-log"]
              : []),
          ].map((kind, sequence) => ({
            kind,
            sequence,
            cpu: { value: kind },
            gpu: { value: kind },
          })),
          toleranceBypassCount: index === 0 ? raw.toleranceBypassCount : 0,
          negativeControls:
            index === 0 ? structuredClone(raw.negativeControls) : [],
        },
        timing: {
          schema: "phase5-timing-v1",
          fixtureId: fixture.id,
          submissionSamples:
            index === 0 ? structuredClone(raw.submissions.samples) : [],
          interactions:
            index === 0 ? structuredClone(raw.interactions) : [],
          deviceLossCount: index === 0 ? raw.submissions.deviceLossCount : 0,
          uncapturedErrorCount:
            index === 0 ? raw.submissions.uncapturedErrorCount : 0,
          hiddenRetryCount: index === 0 ? raw.submissions.hiddenRetryCount : 0,
        },
        readback: {
          schema: "phase5-readback-v1",
          fixtureId: fixture.id,
          records: structuredClone(
            raw.readback.records.filter(
              (entry) => entry.fixtureId === fixture.id,
            ),
          ),
          fullFieldDisplayFrameCount:
            raw.readback.records.filter(
              (entry) =>
                entry.fixtureId === fixture.id &&
                entry.fullField &&
                entry.displayFrame,
            ).length,
          totalBytes: raw.readback.records
            .filter((entry) => entry.fixtureId === fixture.id)
            .reduce((sum, entry) => sum + entry.byteLength, 0),
        },
      }],
    ),
    stdout: new TextEncoder().encode("browser probe passed\n"),
    stderr: new Uint8Array(),
    exitStatus: 0,
  };
}
