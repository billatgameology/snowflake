// Phase 5 WP0: the criteria-first GPU conformance protocol. This file deliberately lives in
// runner, upstream of the future solver-gpu package, so fixtures and tolerances exist before
// production WGSL output can influence them.

import type { Dims, DomainShape, FarFieldCondition, GGPresetName } from "@vcc/core";

export const PHASE5_PROTOCOL = "phase5-gpu-conformance-v1";
export const PHASE5_PROTOCOL_SHA256 =
  "b62ec34cf118ebffbfd493203b68ff1028cf057f1b1736b5fc5028a87091ff09";
export const PHASE5_FIXTURES_SHA256 =
  "29874e660296676113fc2851804be7e47dc994dea0cc3a5caf35d8aabfb67512";
export const PHASE5_TOLERANCES_SHA256 =
  "96bf73b6e3a4f1937c86972f7cadf00766afdacc8f13c5efb5ab416184ce4053";
export const PHASE5_GATE_COMMAND = "node runner/src/main.ts gate5";
export const PHASE5_LANE_COMMAND = "node runner/src/main.ts gate5-lane";
export const PHASE5_HEADLESS_RUNTIME = "playwright-bundled-chromium";
export const PHASE5_HEADLESS_RUNTIME_VERSION = "playwright-1.61.1/chromium-1228";
export const PHASE5_EXPECTED_WINDOWS_BACKEND = "D3D12";
export const PHASE5_EXPECTED_METAL_BACKEND = "metal";
export const PHASE5_CROSS_BACKEND_TOLERANCE_MULTIPLIER = 2;

export const PHASE5_LANES = [
  {
    id: "windows-d3d12",
    operatingSystem: "windows",
    expectedBackend: PHASE5_EXPECTED_WINDOWS_BACKEND,
  },
  {
    id: "macos-metal",
    operatingSystem: "macos",
    expectedBackend: PHASE5_EXPECTED_METAL_BACKEND,
  },
] as const;

export const PHASE5_CHECKPOINT_CONVERSION = {
  id: "gpu-f32-widen-to-existing-f64-v1",
  gpuScalarType: "float32",
  cpuCodecScalarType: "float64",
  ggCodecVersion: 1,
  lkCodecVersion: 2,
  wideningOnly: true,
  newWireMeaning: false,
} as const;

export const PHASE5_LANE_ARTIFACT_PATHS = [
  "lane-manifest.json",
  "lane-report.json",
  "artifact-index.json",
  "stdout.log",
  "stderr.log",
  "exit-status.txt",
  "fixtures/<fixture-id>/config.json",
  "fixtures/<fixture-id>/cpu-reference.ckpt",
  "fixtures/<fixture-id>/gpu-export.ckpt",
  "fixtures/<fixture-id>/comparison.json",
  "fixtures/<fixture-id>/events.json",
  "fixtures/<fixture-id>/timing.json",
  "fixtures/<fixture-id>/readback.json",
] as const;

export const PHASE5_AGGREGATE_ARTIFACT_PATHS = [
  "gate5-report.json",
  "gate5-artifact-index.json",
] as const;

export const PHASE5_EVIDENCE_SCHEMA = {
  laneManifest: "phase5-lane-manifest-v1",
  laneReport: "phase5-lane-report-v1",
  artifactIndex: "phase5-artifact-index-v1",
  comparison: "phase5-comparison-v1",
  aggregateReport: "phase5-gate-report-v1",
  textEncoding: "utf-8-no-bom",
  binaryEndianness: "little-endian",
  digest: "sha256",
  publication: "atomic-staging-rename",
} as const;

export const PHASE5_REQUIRED_FEATURES = ["timestamp-query"] as const;
export const PHASE5_REQUIRED_LIMITS = {
  maxBufferSize: 256 * 1024 * 1024,
  maxStorageBufferBindingSize: 64 * 1024 * 1024,
  maxStorageBuffersPerShaderStage: 8,
  maxComputeWorkgroupStorageSize: 16 * 1024,
  maxComputeInvocationsPerWorkgroup: 256,
  maxComputeWorkgroupSizeX: 256,
  maxComputeWorkgroupsPerDimension: 65_535,
} as const;

export const PHASE5_MEMORY_PLANNING = {
  bytesPerCellCeiling: 64,
  nonCellAndTransientBytesCeiling: 256 * 1024 * 1024,
} as const;

export type Phase5BudgetName =
  | "dev-plate"
  | "dev-column"
  | "preview-plate"
  | "preview-column"
  | "detailed-plate"
  | "detailed-column"
  | "bake-plate"
  | "bake-column";

export interface Phase5Budget {
  readonly id: Phase5BudgetName;
  readonly dims: Dims;
  readonly disposition: "blocking" | "capability-reported";
}

export const PHASE5_BUDGETS: readonly Phase5Budget[] = [
  { id: "dev-plate", dims: { nx: 128, ny: 128, nz: 64 }, disposition: "blocking" },
  { id: "dev-column", dims: { nx: 80, ny: 80, nz: 160 }, disposition: "blocking" },
  { id: "preview-plate", dims: { nx: 400, ny: 400, nz: 50 }, disposition: "blocking" },
  { id: "preview-column", dims: { nx: 160, ny: 160, nz: 320 }, disposition: "blocking" },
  {
    id: "detailed-plate",
    dims: { nx: 800, ny: 800, nz: 48 },
    disposition: "capability-reported",
  },
  {
    id: "detailed-column",
    dims: { nx: 320, ny: 320, nz: 300 },
    disposition: "capability-reported",
  },
  {
    id: "bake-plate",
    dims: { nx: 1600, ny: 1600, nz: 52 },
    disposition: "capability-reported",
  },
  {
    id: "bake-column",
    dims: { nx: 640, ny: 640, nz: 320 },
    disposition: "capability-reported",
  },
] as const;

interface Phase5FixtureBase {
  readonly id: string;
  readonly dims: Dims;
  readonly domain: DomainShape;
  readonly seedRadius: number | null;
  readonly seedThickness: number;
  readonly rngSeed: number;
  readonly noiseEpsilon: number;
  readonly stop: Readonly<Record<string, number | string>>;
  readonly blocking: boolean;
}

export interface Phase5LayoutFixture extends Phase5FixtureBase {
  readonly kind: "layout";
  readonly pattern: "counter-hash-u32-f32";
}

export interface Phase5DiffusionFixture extends Phase5FixtureBase {
  readonly kind: "diffusion";
  readonly farField: FarFieldCondition;
  readonly preset: GGPresetName;
  readonly phi: number;
  readonly passes: readonly number[];
}

export interface Phase5GGFixture extends Phase5FixtureBase {
  readonly kind: "gg";
  readonly farField: FarFieldCondition;
  readonly preset: GGPresetName;
  readonly phi: number;
  readonly timeline:
    | null
    | {
        readonly completedCycle: number;
        readonly nextPreset: GGPresetName;
      };
}

export interface Phase5LKFixture extends Phase5FixtureBase {
  readonly kind: "lk";
  readonly farField: FarFieldCondition;
  readonly surfacePolicy: "aggregate-hv-g1h1-v5";
  readonly tempC: number;
  readonly sigmaInfinity: number;
  readonly dxUm: number;
  readonly pressurePa: number;
  readonly paramSet: "CAK_A1";
  readonly cflFill: number;
  readonly relaxTol: number;
  readonly divTol: number;
  readonly relaxMaxSweeps: number;
  readonly timeline:
    | null
    | {
        readonly completedStep: number;
        readonly tempC: number;
        readonly sigmaInfinity: number;
      };
}

export interface Phase5StressFixture {
  readonly id: string;
  readonly kind: "stress";
  readonly blocking: false;
  readonly stress:
    | "gg-attachment-margin"
    | "lk-fill-margin"
    | "lk-nonlinear-boundary"
    | "signed-subsaturation";
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly observable: string;
}

export type Phase5Fixture =
  | Phase5LayoutFixture
  | Phase5DiffusionFixture
  | Phase5GGFixture
  | Phase5LKFixture
  | Phase5StressFixture;

export const PHASE5_FIXTURES: readonly Phase5Fixture[] = [
  {
    id: "layout-noncubic-box-17x19x11",
    kind: "layout",
    dims: { nx: 17, ny: 19, nz: 11 },
    domain: "box",
    seedRadius: null,
    seedThickness: 1,
    rngSeed: 0x1357_9bdf,
    noiseEpsilon: 0,
    pattern: "counter-hash-u32-f32",
    stop: { kind: "single-round-trip", value: 1 },
    blocking: true,
  },
  {
    id: "diff-small-reflecting-hex-29x31x17",
    kind: "diffusion",
    dims: { nx: 29, ny: 31, nz: 17 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 0x1357_9bdf,
    noiseEpsilon: 0,
    farField: "reflecting",
    preset: "plate",
    phi: 0,
    passes: [1, 64],
    stop: { kind: "pass-cap", value: 64 },
    blocking: true,
  },
  {
    id: "diff-small-dirichlet-noise-drift-31x29x21",
    kind: "diffusion",
    dims: { nx: 31, ny: 29, nz: 21 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 0x2468_ace0,
    noiseEpsilon: 1e-5,
    farField: "dirichlet",
    preset: "dendrite",
    phi: 0.01,
    passes: [1, 64],
    stop: { kind: "pass-cap", value: 64 },
    blocking: true,
  },
  {
    id: "diff-dev-plate-reflecting-128x128x64",
    kind: "diffusion",
    dims: { nx: 128, ny: 128, nz: 64 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "reflecting",
    preset: "plate",
    phi: 0,
    passes: [1],
    stop: { kind: "pass-cap", value: 1 },
    blocking: true,
  },
  {
    id: "diff-dev-column-dirichlet-80x80x160",
    kind: "diffusion",
    dims: { nx: 80, ny: 80, nz: 160 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "dirichlet",
    preset: "needle",
    phi: 0,
    passes: [1],
    stop: { kind: "pass-cap", value: 1 },
    blocking: true,
  },
  {
    id: "gg-plate-reflecting-48x48x24",
    kind: "gg",
    dims: { nx: 48, ny: 48, nz: 24 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "reflecting",
    preset: "plate",
    phi: 0,
    timeline: null,
    stop: { kind: "completed-cycle-cap", value: 256 },
    blocking: true,
  },
  {
    id: "gg-column-dirichlet-noise-timeline-32x32x64",
    kind: "gg",
    dims: { nx: 32, ny: 32, nz: 64 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 0xdeca_fbad,
    noiseEpsilon: 1e-5,
    farField: "dirichlet",
    preset: "needle",
    phi: 0,
    timeline: { completedCycle: 64, nextPreset: "plate" },
    stop: { kind: "completed-cycle-cap", value: 128 },
    blocking: true,
  },
  {
    id: "lk-warm-dirichlet-24x24x18",
    kind: "lk",
    dims: { nx: 24, ny: 24, nz: 18 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "dirichlet",
    surfacePolicy: "aggregate-hv-g1h1-v5",
    tempC: -5,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 200_000,
    timeline: null,
    stop: { kind: "completed-interface-step-cap", value: 4 },
    blocking: true,
  },
  {
    id: "lk-cold-dirichlet-noise-timeline-18x18x30",
    kind: "lk",
    dims: { nx: 18, ny: 18, nz: 30 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 0x1020_3040,
    noiseEpsilon: 0.001,
    farField: "dirichlet",
    surfacePolicy: "aggregate-hv-g1h1-v5",
    tempC: -15,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-9,
    divTol: 1e-7,
    relaxMaxSweeps: 200_000,
    timeline: { completedStep: 2, tempC: -5, sigmaInfinity: 0.002 },
    stop: { kind: "completed-interface-step-cap", value: 4 },
    blocking: true,
  },
  {
    id: "lk-reflecting-diagnostic-17x19x15",
    kind: "lk",
    dims: { nx: 17, ny: 19, nz: 15 },
    domain: "hexPrism",
    seedRadius: 2,
    seedThickness: 1,
    rngSeed: 1,
    noiseEpsilon: 0,
    farField: "reflecting",
    surfacePolicy: "aggregate-hv-g1h1-v5",
    tempC: -15,
    sigmaInfinity: 0.002,
    dxUm: 0.35,
    pressurePa: 101_325,
    paramSet: "CAK_A1",
    cflFill: 0.1,
    relaxTol: 1e-7,
    divTol: 1e-7,
    relaxMaxSweeps: 50_000,
    timeline: null,
    stop: { kind: "completed-interface-step-cap", value: 1 },
    blocking: true,
  },
  {
    id: "stress-gg-attachment-margin",
    kind: "stress",
    blocking: false,
    stress: "gg-attachment-margin",
    inputs: {
      slot: 2,
      ggThreshBeta: 0.02,
      postFreezeBoundaryMass: [0.019_975, 0.020_025],
    },
    observable: "attachment bit on each side of the G-G threshold",
  },
  {
    id: "stress-lk-fill-margin",
    kind: "stress",
    blocking: false,
    stress: "lk-fill-margin",
    inputs: {
      fillBefore: 0.999_96,
      kineticIncrement: [0.000_03, 0.000_05],
    },
    observable: "saturation attachment bit and recorded unapplied excess",
  },
  {
    id: "stress-lk-nonlinear-boundary",
    kind: "stress",
    blocking: false,
    stress: "lk-nonlinear-boundary",
    inputs: {
      tempC: -15,
      facet: "prism",
      sigmaOpp: [1e-8, 1e-6, 1e-4, 0.002],
      robinGeometry: 1,
    },
    observable: "self-consistent boundary supersaturation and attachment coefficient",
  },
  {
    id: "stress-signed-subsaturation",
    kind: "stress",
    blocking: false,
    stress: "signed-subsaturation",
    inputs: {
      tempC: -15,
      facet: "prism",
      sigmaOpp: [-0.002, -1e-8, 0],
      robinGeometry: 1,
    },
    observable: "signed boundary supersaturation with zero kinetic growth",
  },
] as const;

export interface Phase5FieldTolerance {
  readonly maxAbs: number;
  readonly rms: number;
  readonly maxRelative: number;
  readonly relativeDenominatorFloor: number;
}

export const PHASE5_FIELD_TOLERANCES = {
  diffusionD: {
    maxAbs: 2e-6,
    rms: 2e-7,
    maxRelative: 2e-4,
    relativeDenominatorFloor: 1e-5,
  },
  ggBoundaryMass: {
    maxAbs: 5e-5,
    rms: 5e-6,
    maxRelative: 1e-3,
    relativeDenominatorFloor: 1e-5,
  },
  ggVapor: {
    maxAbs: 5e-5,
    rms: 5e-6,
    maxRelative: 1e-3,
    relativeDenominatorFloor: 1e-5,
  },
  lkSigma: {
    maxAbs: 2e-6,
    rms: 2e-7,
    maxRelative: 2e-3,
    relativeDenominatorFloor: 1e-6,
  },
  lkFill: {
    maxAbs: 5e-5,
    rms: 5e-6,
    maxRelative: 1e-3,
    relativeDenominatorFloor: 1e-5,
  },
} as const satisfies Readonly<Record<string, Phase5FieldTolerance>>;

export const PHASE5_SCALAR_TOLERANCES = {
  maxAbs: 1e-4,
  maxRelative: 2e-4,
  relativeDenominatorFloor: 1e-8,
  relaxationResidualMaxAbs: 2e-7,
  divergenceResidualLimit: 1e-7,
  eventDensityMaxRelative: 2e-4,
  fieldDerivedMetricMaxAbs: 1e-4,
} as const;

/** IEEE-754 binary32 spacing at one; WGSL arithmetic uses binary32 for the production fields. */
export const FLOAT32_EPSILON = 2 ** -23;
/** Deterministic tree reduction plus the 12-operation split smoother, with a safety factor. */
export const FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR = 64;

export function float32SmootherDriftAbsLimit(
  activeCellCount: number,
  maxAbsSweepInput: number,
): number {
  if (!Number.isSafeInteger(activeCellCount) || activeCellCount <= 0) {
    throw new Error("activeCellCount must be a positive safe integer");
  }
  if (!Number.isFinite(maxAbsSweepInput) || maxAbsSweepInput < 0) {
    throw new Error("maxAbsSweepInput must be finite and nonnegative");
  }
  if (maxAbsSweepInput === 0) return 0;
  return (
    FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR *
    activeCellCount *
    FLOAT32_EPSILON *
    maxAbsSweepInput
  );
}

export const PHASE5_DECISION_MARGINS = {
  ggBoundaryMass: 8 * PHASE5_FIELD_TOLERANCES.ggBoundaryMass.maxAbs,
  lkFill: 8 * PHASE5_FIELD_TOLERANCES.lkFill.maxAbs,
} as const;

export const PHASE5_PERFORMANCE = {
  sampleCount: 30,
  warmupCount: 5,
  p99Method: "nearest-rank-ceil",
  previewCases: ["preview-plate", "preview-column"],
  gpuProcessesPerPhysicalAdapter: 1,
  editScript: [
    "change-one-valid-operator-control",
    "apply-one-valid-abrupt-event-at-completed-boundary",
    "step",
    "move-slice",
    "request-named-probes",
  ],
  maxSubmissionSegmentMs: 500,
  p99SubmissionSegmentMs: 250,
  editAcknowledgementMs: 100,
  firstValidPostEditFrameMs: 2_000,
  permittedDeviceLosses: 0,
  permittedUncapturedErrors: 0,
  permittedHiddenRetries: 0,
  permittedFullFieldReadbacksPerDisplayFrame: 0,
} as const;

export const PHASE5_CRITERIA = [
  "P5-WINDOWS-PROVENANCE",
  "P5-METAL-PROVENANCE",
  "P5-PROTOCOL-MATCH",
  "P5-ADAPTER-LIMITS",
  "P5-LAYOUT-INDEXING",
  "P5-DIFFUSION",
  "P5-GG-THRESHOLD",
  "P5-LIBBRECHT-KINETICS",
  "P5-SYMMETRY",
  "P5-DOMAIN-SAFETY",
  "P5-CROSS-BACKEND",
  "P5-DISPATCH-SAFETY",
  "P5-EDIT-ACK",
  "P5-FIRST-VALID-FRAME",
  "P5-RESIDENCY",
  "P5-CHECKPOINTS",
  "P5-NEGATIVE-CONTROLS",
  "P5-PUBLICATION",
] as const;

export type Phase5Criterion = (typeof PHASE5_CRITERIA)[number];

export interface Phase5NegativeControl {
  readonly id: string;
  readonly owner: Phase5Criterion;
  readonly mutation: string;
}

export const PHASE5_NEGATIVE_CONTROLS: readonly Phase5NegativeControl[] = [
  {
    id: "NC-WINDOWS-BACKEND-RELABEL",
    owner: "P5-WINDOWS-PROVENANCE",
    mutation: "relabel the observed Windows backend or adapter",
  },
  {
    id: "NC-METAL-BACKEND-RELABEL",
    owner: "P5-METAL-PROVENANCE",
    mutation: "relabel or omit the observed Metal backend or adapter",
  },
  {
    id: "NC-PROTOCOL-HASH-SHIFT",
    owner: "P5-PROTOCOL-MATCH",
    mutation: "shift one fixture or tolerance while retaining the recorded protocol hash",
  },
  {
    id: "NC-REQUIRED-LIMIT-DOWNGRADE",
    owner: "P5-ADAPTER-LIMITS",
    mutation: "omit one required limit or silently lower an unsupported budget",
  },
  {
    id: "NC-AXIS-SWAP",
    owner: "P5-LAYOUT-INDEXING",
    mutation: "swap j and k in the non-cubic index mapping",
  },
  {
    id: "NC-WRONG-BOUNDARY-CLAMP",
    owner: "P5-DIFFUSION",
    mutation: "skip or move the Dirichlet clamp",
  },
  {
    id: "NC-STALE-PING-PONG",
    owner: "P5-GG-THRESHOLD",
    mutation: "reuse the stale diffusion source for a full G-G cycle",
  },
  {
    id: "NC-LK-RESIDUAL-ONLY",
    owner: "P5-LIBBRECHT-KINETICS",
    mutation: "accept fixed-sigma LK convergence from residual alone",
  },
  {
    id: "NC-SYMMETRY-BIT",
    owner: "P5-SYMMETRY",
    mutation: "flip one attachment bit in a registered noise-off orbit",
  },
  {
    id: "NC-DOMAIN-CONTACT",
    owner: "P5-DOMAIN-SAFETY",
    mutation: "mark a contacting fixture as eligible comparison evidence",
  },
  {
    id: "NC-CROSS-BACKEND-SUBSTITUTION",
    owner: "P5-CROSS-BACKEND",
    mutation: "duplicate the Windows bundle in place of the Metal bundle",
  },
  {
    id: "NC-EXCESSIVE-DISPATCH",
    owner: "P5-DISPATCH-SAFETY",
    mutation: "inject one submission segment above the registered maximum",
  },
  {
    id: "NC-LATE-EDIT-ACK",
    owner: "P5-EDIT-ACK",
    mutation: "inject one edit acknowledgement above the registered limit",
  },
  {
    id: "NC-LATE-FIRST-FRAME",
    owner: "P5-FIRST-VALID-FRAME",
    mutation: "inject one first-valid frame above the registered limit",
  },
  {
    id: "NC-FULL-FIELD-PER-FRAME",
    owner: "P5-RESIDENCY",
    mutation: "perform one full-field display-frame readback",
  },
  {
    id: "NC-CHECKPOINT-DTYPE-SHIFT",
    owner: "P5-CHECKPOINTS",
    mutation: "shift one field dtype, length, or endianness declaration",
  },
  {
    id: "NC-TOLERANCE-BYPASS",
    owner: "P5-NEGATIVE-CONTROLS",
    mutation: "report pass while one raw comparison exceeds its frozen tolerance",
  },
  {
    id: "NC-ARTIFACT-BYTE-MUTATION",
    owner: "P5-PUBLICATION",
    mutation: "mutate one indexed artifact byte after publication",
  },
] as const;

export interface Phase5ProtocolManifest {
  readonly protocol: typeof PHASE5_PROTOCOL;
  readonly fixturesSha256: typeof PHASE5_FIXTURES_SHA256;
  readonly tolerancesSha256: typeof PHASE5_TOLERANCES_SHA256;
  readonly gateCommand: typeof PHASE5_GATE_COMMAND;
  readonly laneCommand: typeof PHASE5_LANE_COMMAND;
  readonly headlessRuntime: typeof PHASE5_HEADLESS_RUNTIME;
  readonly headlessRuntimeVersion: typeof PHASE5_HEADLESS_RUNTIME_VERSION;
  readonly lanes: typeof PHASE5_LANES;
  readonly crossBackendToleranceMultiplier:
    typeof PHASE5_CROSS_BACKEND_TOLERANCE_MULTIPLIER;
  readonly checkpointConversion: typeof PHASE5_CHECKPOINT_CONVERSION;
  readonly laneArtifactPaths: typeof PHASE5_LANE_ARTIFACT_PATHS;
  readonly aggregateArtifactPaths: typeof PHASE5_AGGREGATE_ARTIFACT_PATHS;
  readonly evidenceSchema: typeof PHASE5_EVIDENCE_SCHEMA;
  readonly requiredFeatures: typeof PHASE5_REQUIRED_FEATURES;
  readonly requiredLimits: typeof PHASE5_REQUIRED_LIMITS;
  readonly memoryPlanning: typeof PHASE5_MEMORY_PLANNING;
  readonly budgets: typeof PHASE5_BUDGETS;
  readonly fixtures: typeof PHASE5_FIXTURES;
  readonly fieldTolerances: typeof PHASE5_FIELD_TOLERANCES;
  readonly scalarTolerances: typeof PHASE5_SCALAR_TOLERANCES;
  readonly decisionMargins: typeof PHASE5_DECISION_MARGINS;
  readonly performance: typeof PHASE5_PERFORMANCE;
  readonly criteria: typeof PHASE5_CRITERIA;
  readonly negativeControls: typeof PHASE5_NEGATIVE_CONTROLS;
}

export function phase5ProtocolManifest(): Phase5ProtocolManifest {
  return {
    protocol: PHASE5_PROTOCOL,
    fixturesSha256: PHASE5_FIXTURES_SHA256,
    tolerancesSha256: PHASE5_TOLERANCES_SHA256,
    gateCommand: PHASE5_GATE_COMMAND,
    laneCommand: PHASE5_LANE_COMMAND,
    headlessRuntime: PHASE5_HEADLESS_RUNTIME,
    headlessRuntimeVersion: PHASE5_HEADLESS_RUNTIME_VERSION,
    lanes: PHASE5_LANES,
    crossBackendToleranceMultiplier:
      PHASE5_CROSS_BACKEND_TOLERANCE_MULTIPLIER,
    checkpointConversion: PHASE5_CHECKPOINT_CONVERSION,
    laneArtifactPaths: PHASE5_LANE_ARTIFACT_PATHS,
    aggregateArtifactPaths: PHASE5_AGGREGATE_ARTIFACT_PATHS,
    evidenceSchema: PHASE5_EVIDENCE_SCHEMA,
    requiredFeatures: PHASE5_REQUIRED_FEATURES,
    requiredLimits: PHASE5_REQUIRED_LIMITS,
    memoryPlanning: PHASE5_MEMORY_PLANNING,
    budgets: PHASE5_BUDGETS,
    fixtures: PHASE5_FIXTURES,
    fieldTolerances: PHASE5_FIELD_TOLERANCES,
    scalarTolerances: PHASE5_SCALAR_TOLERANCES,
    decisionMargins: PHASE5_DECISION_MARGINS,
    performance: PHASE5_PERFORMANCE,
    criteria: PHASE5_CRITERIA,
    negativeControls: PHASE5_NEGATIVE_CONTROLS,
  };
}

export function phase5FixtureManifest() {
  return { fixtures: PHASE5_FIXTURES } as const;
}

export function phase5ToleranceManifest() {
  return {
    fieldTolerances: PHASE5_FIELD_TOLERANCES,
    scalarTolerances: PHASE5_SCALAR_TOLERANCES,
    decisionMargins: PHASE5_DECISION_MARGINS,
    float32Epsilon: FLOAT32_EPSILON,
    float32SmootherDriftBoundFactor: FLOAT32_SMOOTHER_DRIFT_BOUND_FACTOR,
    crossBackendToleranceMultiplier:
      PHASE5_CROSS_BACKEND_TOLERANCE_MULTIPLIER,
  } as const;
}
