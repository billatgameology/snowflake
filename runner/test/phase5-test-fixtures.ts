import {
  PHASE5_FIXTURES,
  PHASE5_BUDGETS,
  PHASE5_FIXTURES_SHA256,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_NEGATIVE_CONTROLS,
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
            (name) => ({
              name,
              cpu: 1,
              gpu: 1,
              blocking: !(
                fixture.id ===
                  "gg-column-dirichlet-noise-timeline-32x32x64" &&
                name === "relaxation.shell-clamp"
              ),
              rationale:
                fixture.id ===
                    "gg-column-dirichlet-noise-timeline-32x32x64" &&
                  name === "relaxation.shell-clamp"
                  ? PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE
                  : null,
            }),
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
