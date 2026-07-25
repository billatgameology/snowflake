// Phase 5 lane and aggregate criterion evaluation.
//
// The browser probe owns raw measurements. This module owns the independent threshold,
// completeness, and uniquely-owned negative-control decisions consumed by both publishers.

import {
  PHASE5_CRITERIA,
  PHASE5_BUDGETS,
  PHASE5_EXPECTED_WINDOWS_BACKEND,
  PHASE5_FIXTURES,
  PHASE5_FIXTURES_SHA256,
  PHASE5_HEADLESS_RUNTIME,
  PHASE5_HEADLESS_RUNTIME_VERSION,
  PHASE5_NEGATIVE_CONTROLS,
  PHASE5_PERFORMANCE,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_REQUIRED_FEATURES,
  PHASE5_REQUIRED_LIMITS,
  PHASE5_TOLERANCES_SHA256,
  phase5FixtureManifest,
  phase5ProtocolManifest,
  phase5ToleranceManifest,
  type Phase5Criterion,
} from "./phase5-protocol.ts";
import {
  canonicalJson,
  canonicalJsonSha256,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";

export const PHASE5_RAW_EVIDENCE_SCHEMA = "phase5-lane-raw-v1";

export interface Phase5FixtureMeasurement {
  readonly id: string;
  readonly kind: "layout" | "diffusion" | "gg" | "lk";
  readonly blocking: boolean;
  readonly comparisonFailureCount: number;
  readonly fieldFailureCount: number;
  readonly scalarFailureCount: number;
  readonly decisionFailureCount: number;
  readonly invariantFailureCount: number;
  readonly symmetryChecked: boolean;
  readonly symmetryMismatchCount: number;
  readonly domainContact: boolean;
  readonly stopReasonMatch: boolean;
}

export interface Phase5InteractionMeasurement {
  readonly budgetId: "preview-plate" | "preview-column";
  readonly sample: number;
  readonly editAcknowledgementMs: number;
  readonly firstValidFrameMs: number;
  readonly editGeneration: number;
  readonly acceptedGeneration: number;
  readonly renderedGeneration: number;
}

export interface Phase5SubmissionMeasurement {
  readonly budgetId: "preview-plate" | "preview-column";
  readonly sample: number;
  readonly warmup: boolean;
  readonly segmentWallMs: readonly number[];
}

export interface Phase5BudgetMeasurement {
  readonly id:
    | "dev-plate"
    | "dev-column"
    | "preview-plate"
    | "preview-column"
    | "detailed-plate"
    | "detailed-column"
    | "bake-plate"
    | "bake-column";
  readonly disposition: "blocking" | "capability-reported";
  readonly requiredBytes: number;
  readonly planningCeilingBytes: number;
  readonly supported: boolean;
  readonly allocated: boolean;
  readonly allocatedBytes: number | null;
  readonly failureReason: string | null;
}

export interface Phase5ReadbackMeasurement {
  readonly fixtureId: string;
  readonly purpose:
    | "test"
    | "named-probe"
    | "compact-metric"
    | "evidence-snapshot"
    | "checkpoint";
  readonly label: string;
  readonly generation: number;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly sequence: number;
  readonly sourceId: number;
  readonly sourceByteLength: number;
  readonly fullField: boolean;
  readonly displayFrame: boolean;
  readonly displayFrameSequence: number | null;
  readonly displayFrameLabel: string | null;
}

export interface Phase5StressDiagnosticMeasurement {
  readonly id: string;
  readonly stress:
    | "gg-attachment-margin"
    | "lk-fill-margin"
    | "lk-nonlinear-boundary"
    | "signed-subsaturation";
  readonly measurements: StrictJson;
  readonly pass: boolean;
}

export interface Phase5CheckpointMeasurement {
  readonly fixtureId: string;
  readonly codec: "gg-v1" | "lk-v2";
  readonly cpuDecodePass: boolean;
  readonly gpuDecodePass: boolean;
  readonly occupancyMismatchCount: number;
  readonly metadataMismatchCount: number;
  readonly float32RoundTripMismatchCount: number;
  readonly scalarType: "float32";
  readonly endianness: "little-endian";
}

export interface Phase5NegativeControlMeasurement {
  readonly id: string;
  readonly owner: Phase5Criterion;
  readonly mutation: string;
  readonly rejected: boolean;
  readonly failedCriteria: readonly Phase5Criterion[];
}

export interface Phase5LaneRawEvidence {
  readonly schema: typeof PHASE5_RAW_EVIDENCE_SCHEMA;
  readonly repository: {
    readonly commit: string;
    readonly clean: boolean;
  };
  readonly host: {
    readonly platform: string;
    readonly release: string;
    readonly architecture: string;
    readonly cpu: string;
    readonly logicalProcessors: number;
    readonly totalMemoryBytes: number;
  };
  readonly runtime: {
    readonly name: string;
    readonly version: string;
    readonly product: string;
    readonly revision: string;
    readonly executablePath: string;
    readonly launchFlags: readonly string[];
  };
  readonly adapter: {
    readonly vendor: string;
    readonly architecture: string;
    readonly device: string;
    readonly description: string;
    readonly backend: string;
    readonly type: string;
    readonly driver: string;
    readonly features: readonly string[];
    readonly requestedFeatures: readonly string[];
    readonly limits: Readonly<Record<string, number>>;
    readonly requestedLimits: Readonly<Record<string, number>>;
    readonly deviceLimits: Readonly<Record<string, number>>;
    readonly budgets: readonly Phase5BudgetMeasurement[];
  };
  readonly protocol: {
    readonly id: string;
    readonly sha256: string;
    readonly fixtureSha256: string;
    readonly toleranceSha256: string;
    readonly manifest: StrictJson;
    readonly fixtureManifest: StrictJson;
    readonly toleranceManifest: StrictJson;
  };
  readonly fixtures: readonly Phase5FixtureMeasurement[];
  readonly stressDiagnostics: readonly Phase5StressDiagnosticMeasurement[];
  readonly submissions: {
    readonly samples: readonly Phase5SubmissionMeasurement[];
    readonly deviceLossCount: number;
    readonly uncapturedErrorCount: number;
    readonly hiddenRetryCount: number;
  };
  readonly interactions: readonly Phase5InteractionMeasurement[];
  readonly readback: {
    readonly records: readonly Phase5ReadbackMeasurement[];
    readonly fullFieldDisplayFrameCount: number;
    readonly totalBytes: number;
  };
  readonly checkpoints: readonly Phase5CheckpointMeasurement[];
  readonly toleranceBypassCount: number;
  readonly negativeControls: readonly Phase5NegativeControlMeasurement[];
  readonly publicationVerified: boolean;
}

export interface Phase5CriterionResult {
  readonly id: Phase5Criterion;
  readonly pass: boolean;
  readonly failures: readonly string[];
  readonly measurements: StrictJson;
}

export interface Phase5LaneVerdict {
  readonly criteria: readonly Phase5CriterionResult[];
  readonly gatePass: boolean;
  readonly exitCode: 0 | 1;
}

function finiteNonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative`);
  }
  return value;
}

function count(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative safe integer`);
  }
  return value;
}

function exactStringSet(actual: readonly string[], expected: readonly string[]): boolean {
  const left = [...actual].sort();
  const right = [...expected].sort();
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function evidenceObject(
  value: StrictJson,
  keys: readonly string[],
  label: string,
): Readonly<Record<string, StrictJson>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const object = value as Readonly<Record<string, StrictJson>>;
  const actual = Object.keys(object).sort(lexical);
  const expected = [...keys].sort(lexical);
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} keys differ from the frozen schema`);
  }
  return object;
}

function evidenceArray(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function stringArray(value: StrictJson, label: string): readonly string[] {
  const array = evidenceArray(value, label);
  if (array.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must contain only strings`);
  }
  return array as readonly string[];
}

function numberRecord(value: StrictJson, label: string): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  if (Object.values(value).some((entry) => typeof entry !== "number")) {
    throw new Error(`${label} values must be numbers`);
  }
}

/**
 * Runtime boundary for browser-produced evidence. Exact keys make schema additions fail
 * closed instead of being silently ignored by an older evaluator.
 */
export function validatePhase5RawEvidence(
  value: unknown,
): Phase5LaneRawEvidence {
  const snapshot = strictJsonSnapshot(value);
  const raw = evidenceObject(
    snapshot,
    [
      "schema",
      "repository",
      "host",
      "runtime",
      "adapter",
      "protocol",
      "fixtures",
      "stressDiagnostics",
      "submissions",
      "interactions",
      "readback",
      "checkpoints",
      "toleranceBypassCount",
      "negativeControls",
      "publicationVerified",
    ],
    "Phase 5 raw evidence",
  );
  const repository = evidenceObject(
    raw.repository,
    ["commit", "clean"],
    "repository",
  );
  const host = evidenceObject(
    raw.host,
    [
      "platform",
      "release",
      "architecture",
      "cpu",
      "logicalProcessors",
      "totalMemoryBytes",
    ],
    "host",
  );
  const runtime = evidenceObject(
    raw.runtime,
    [
      "name",
      "version",
      "product",
      "revision",
      "executablePath",
      "launchFlags",
    ],
    "runtime",
  );
  const adapter = evidenceObject(
    raw.adapter,
    [
      "vendor",
      "architecture",
      "device",
      "description",
      "backend",
      "type",
      "driver",
      "features",
      "requestedFeatures",
      "limits",
      "requestedLimits",
      "deviceLimits",
      "budgets",
    ],
    "adapter",
  );
  const protocol = evidenceObject(
    raw.protocol,
    [
      "id",
      "sha256",
      "fixtureSha256",
      "toleranceSha256",
      "manifest",
      "fixtureManifest",
      "toleranceManifest",
    ],
    "protocol",
  );
  const submissions = evidenceObject(
    raw.submissions,
    ["samples", "deviceLossCount", "uncapturedErrorCount", "hiddenRetryCount"],
    "submissions",
  );
  const readback = evidenceObject(
    raw.readback,
    ["records", "fullFieldDisplayFrameCount", "totalBytes"],
    "readback",
  );
  for (const [label, object, strings, booleans] of [
    ["repository", repository, ["commit"], ["clean"]],
    ["host", host, ["platform", "release", "architecture", "cpu"], []],
    [
      "runtime",
      runtime,
      ["name", "version", "product", "revision", "executablePath"],
      [],
    ],
    [
      "adapter",
      adapter,
      [
        "vendor",
        "architecture",
        "device",
        "description",
        "backend",
        "type",
        "driver",
      ],
      [],
    ],
    [
      "protocol",
      protocol,
      ["id", "sha256", "fixtureSha256", "toleranceSha256"],
      [],
    ],
  ] as const) {
    for (const key of strings) {
      if (typeof object[key] !== "string") {
        throw new Error(`${label}.${key} must be a string`);
      }
    }
    for (const key of booleans) {
      if (typeof object[key] !== "boolean") {
        throw new Error(`${label}.${key} must be a boolean`);
      }
    }
  }
  stringArray(adapter.features, "adapter.features");
  stringArray(adapter.requestedFeatures, "adapter.requestedFeatures");
  stringArray(runtime.launchFlags, "runtime.launchFlags");
  numberRecord(adapter.limits, "adapter.limits");
  numberRecord(adapter.requestedLimits, "adapter.requestedLimits");
  numberRecord(adapter.deviceLimits, "adapter.deviceLimits");
  for (const key of ["logicalProcessors", "totalMemoryBytes"] as const) {
    if (typeof host[key] !== "number") {
      throw new Error(`host.${key} must be a number`);
    }
  }
  const budgets = evidenceArray(adapter.budgets, "adapter.budgets");
  for (const [index, entry] of budgets.entries()) {
    const object = evidenceObject(
      entry,
      [
        "id",
        "disposition",
        "requiredBytes",
        "planningCeilingBytes",
        "supported",
        "allocated",
        "allocatedBytes",
        "failureReason",
      ],
      `adapter.budgets[${index}]`,
    );
    if (
      typeof object.id !== "string" ||
      typeof object.disposition !== "string" ||
      typeof object.requiredBytes !== "number" ||
      typeof object.planningCeilingBytes !== "number" ||
      typeof object.supported !== "boolean" ||
      typeof object.allocated !== "boolean" ||
      (object.allocatedBytes !== null && typeof object.allocatedBytes !== "number") ||
      (object.failureReason !== null && typeof object.failureReason !== "string")
    ) {
      throw new Error(`adapter.budgets[${index}] values are invalid`);
    }
  }
  const submissionSamples = evidenceArray(
    submissions.samples,
    "submissions.samples",
  );
  for (const [index, entry] of submissionSamples.entries()) {
    const object = evidenceObject(
      entry,
      ["budgetId", "sample", "warmup", "segmentWallMs"],
      `submissions.samples[${index}]`,
    );
    if (
      typeof object.budgetId !== "string" ||
      !["preview-plate", "preview-column"].includes(object.budgetId) ||
      typeof object.sample !== "number" ||
      typeof object.warmup !== "boolean"
    ) {
      throw new Error(`submissions.samples[${index}] identity is invalid`);
    }
    const segments = evidenceArray(
      object.segmentWallMs,
      `submissions.samples[${index}].segmentWallMs`,
    );
    if (segments.some((segment) => typeof segment !== "number")) {
      throw new Error(`submissions.samples[${index}] segments are invalid`);
    }
  }
  for (const key of [
    "deviceLossCount",
    "uncapturedErrorCount",
    "hiddenRetryCount",
  ] as const) {
    if (typeof submissions[key] !== "number") {
      throw new Error(`submissions.${key} must be a number`);
    }
  }
  if (typeof readback.fullFieldDisplayFrameCount !== "number") {
    throw new Error("readback.fullFieldDisplayFrameCount must be a number");
  }
  if (typeof readback.totalBytes !== "number") {
    throw new Error("readback.totalBytes must be a number");
  }
  const readbackRecords = evidenceArray(readback.records, "readback.records");
  for (const [index, entry] of readbackRecords.entries()) {
    const object = evidenceObject(
      entry,
      [
        "fixtureId",
        "purpose",
        "label",
        "generation",
        "byteOffset",
        "byteLength",
        "sequence",
        "sourceId",
        "sourceByteLength",
        "fullField",
        "displayFrame",
        "displayFrameSequence",
        "displayFrameLabel",
      ],
      `readback.records[${index}]`,
    );
    for (const key of ["fixtureId", "purpose", "label"] as const) {
      if (typeof object[key] !== "string") {
        throw new Error(`readback.records[${index}].${key} must be a string`);
      }
    }
    for (const key of [
      "generation",
      "byteOffset",
      "byteLength",
      "sequence",
      "sourceId",
      "sourceByteLength",
    ] as const) {
      if (typeof object[key] !== "number") {
        throw new Error(`readback.records[${index}].${key} must be a number`);
      }
    }
    for (const key of ["fullField", "displayFrame"] as const) {
      if (typeof object[key] !== "boolean") {
        throw new Error(`readback.records[${index}].${key} must be a boolean`);
      }
    }
    if (
      (object.displayFrameSequence !== null &&
        typeof object.displayFrameSequence !== "number") ||
      (object.displayFrameLabel !== null &&
        typeof object.displayFrameLabel !== "string")
    ) {
      throw new Error(`readback.records[${index}] frame identity is invalid`);
    }
  }

  const fixtures = evidenceArray(raw.fixtures, "fixtures");
  for (const [index, entry] of fixtures.entries()) {
    const object = evidenceObject(
      entry,
      [
        "id",
        "kind",
        "blocking",
        "comparisonFailureCount",
        "fieldFailureCount",
        "scalarFailureCount",
        "decisionFailureCount",
        "invariantFailureCount",
        "symmetryChecked",
        "symmetryMismatchCount",
        "domainContact",
        "stopReasonMatch",
      ],
      `fixtures[${index}]`,
    );
    if (
      typeof object.id !== "string" ||
      typeof object.kind !== "string" ||
      !["layout", "diffusion", "gg", "lk"].includes(object.kind) ||
      typeof object.blocking !== "boolean" ||
      typeof object.symmetryChecked !== "boolean" ||
      typeof object.domainContact !== "boolean" ||
      typeof object.stopReasonMatch !== "boolean"
    ) {
      throw new Error(`fixtures[${index}] scalar identity is invalid`);
    }
    for (const key of [
      "comparisonFailureCount",
      "fieldFailureCount",
      "scalarFailureCount",
      "decisionFailureCount",
      "invariantFailureCount",
      "symmetryMismatchCount",
    ] as const) {
      if (typeof object[key] !== "number") {
        throw new Error(`fixtures[${index}].${key} must be a number`);
      }
    }
  }

  const interactions = evidenceArray(raw.interactions, "interactions");
  for (const [index, entry] of interactions.entries()) {
    const object = evidenceObject(
      entry,
      [
        "budgetId",
        "sample",
        "editAcknowledgementMs",
        "firstValidFrameMs",
        "editGeneration",
        "acceptedGeneration",
        "renderedGeneration",
      ],
      `interactions[${index}]`,
    );
    if (
      typeof object.budgetId !== "string" ||
      !["preview-plate", "preview-column"].includes(object.budgetId) ||
      Object.entries(object).some(
        ([key, entryValue]) => key !== "budgetId" && typeof entryValue !== "number",
      )
    ) {
      throw new Error(`interactions[${index}] values are invalid`);
    }
  }

  const stressDiagnostics = evidenceArray(
    raw.stressDiagnostics,
    "stressDiagnostics",
  );
  for (const [index, entry] of stressDiagnostics.entries()) {
    const object = evidenceObject(
      entry,
      ["id", "stress", "measurements", "pass"],
      `stressDiagnostics[${index}]`,
    );
    if (
      typeof object.id !== "string" ||
      typeof object.stress !== "string" ||
      typeof object.pass !== "boolean"
    ) {
      throw new Error(`stressDiagnostics[${index}] identity is invalid`);
    }
  }

  const checkpoints = evidenceArray(raw.checkpoints, "checkpoints");
  for (const [index, entry] of checkpoints.entries()) {
    const object = evidenceObject(
      entry,
      [
        "fixtureId",
        "codec",
        "cpuDecodePass",
        "gpuDecodePass",
        "occupancyMismatchCount",
        "metadataMismatchCount",
        "float32RoundTripMismatchCount",
        "scalarType",
        "endianness",
      ],
      `checkpoints[${index}]`,
    );
    for (const key of ["fixtureId", "codec", "scalarType", "endianness"] as const) {
      if (typeof object[key] !== "string") {
        throw new Error(`checkpoints[${index}].${key} must be a string`);
      }
    }
    for (const key of ["cpuDecodePass", "gpuDecodePass"] as const) {
      if (typeof object[key] !== "boolean") {
        throw new Error(`checkpoints[${index}].${key} must be a boolean`);
      }
    }
    for (const key of [
      "occupancyMismatchCount",
      "metadataMismatchCount",
      "float32RoundTripMismatchCount",
    ] as const) {
      if (typeof object[key] !== "number") {
        throw new Error(`checkpoints[${index}].${key} must be a number`);
      }
    }
  }

  const controls = evidenceArray(raw.negativeControls, "negativeControls");
  for (const [index, entry] of controls.entries()) {
    const object = evidenceObject(
      entry,
      ["id", "owner", "mutation", "rejected", "failedCriteria"],
      `negativeControls[${index}]`,
    );
    if (
      typeof object.id !== "string" ||
      typeof object.owner !== "string" ||
      typeof object.mutation !== "string" ||
      typeof object.rejected !== "boolean"
    ) {
      throw new Error(`negativeControls[${index}] identity is invalid`);
    }
    stringArray(object.failedCriteria, `negativeControls[${index}].failedCriteria`);
  }
  if (
    typeof raw.schema !== "string" ||
    typeof raw.toleranceBypassCount !== "number" ||
    typeof raw.publicationVerified !== "boolean"
  ) {
    throw new Error("Phase 5 raw evidence terminal values are invalid");
  }
  return snapshot as unknown as Phase5LaneRawEvidence;
}

function result(
  id: Phase5Criterion,
  failures: readonly string[],
  measurements: unknown,
): Phase5CriterionResult {
  return {
    id,
    pass: failures.length === 0,
    failures: [...failures],
    measurements: strictJsonSnapshot(measurements),
  };
}

function fixtureFailures(
  fixtures: readonly Phase5FixtureMeasurement[],
  kind: Phase5FixtureMeasurement["kind"],
): string[] {
  const expected = PHASE5_FIXTURES.filter(
    (fixture) => fixture.blocking && fixture.kind === kind,
  ).map((fixture) => fixture.id);
  const actual = fixtures.filter((fixture) => fixture.kind === kind);
  const failures: string[] = [];
  if (!exactStringSet(actual.map((fixture) => fixture.id), expected)) {
    failures.push(`${kind} fixture inventory differs from the frozen protocol`);
  }
  for (const fixture of actual) {
    for (const [name, value] of [
      ["comparisonFailureCount", fixture.comparisonFailureCount],
      ["fieldFailureCount", fixture.fieldFailureCount],
      ["scalarFailureCount", fixture.scalarFailureCount],
      ["decisionFailureCount", fixture.decisionFailureCount],
      ["invariantFailureCount", fixture.invariantFailureCount],
    ] as const) {
      count(value, `${fixture.id}.${name}`);
      if (value !== 0) failures.push(`${fixture.id} has ${name}=${value}`);
    }
    if (!fixture.blocking) failures.push(`${fixture.id} is not marked blocking`);
    if (!fixture.stopReasonMatch) failures.push(`${fixture.id} stop reason differs`);
  }
  return failures;
}

function criterionMap(
  criteria: readonly Phase5CriterionResult[],
): ReadonlyMap<Phase5Criterion, Phase5CriterionResult> {
  return new Map(criteria.map((entry) => [entry.id, entry]));
}

function blockingFixture(
  raw: Phase5LaneRawEvidence,
  kind: Phase5FixtureMeasurement["kind"],
): Phase5FixtureMeasurement {
  const fixture = raw.fixtures.find((entry) => entry.kind === kind);
  if (fixture === undefined) throw new Error(`missing ${kind} negative-control fixture`);
  return fixture;
}

function applyPhase5CriterionMutation(
  owner: Phase5Criterion,
  raw: Phase5LaneRawEvidence,
): void {
  switch (owner) {
    case "P5-WINDOWS-PROVENANCE":
      (raw.adapter as { backend: string }).backend = "Vulkan";
      return;
    case "P5-PROTOCOL-MATCH": {
      const manifest = raw.protocol.fixtureManifest as {
        fixtures: Array<{ rngSeed: number }>;
      };
      manifest.fixtures[0].rngSeed += 1;
      return;
    }
    case "P5-ADAPTER-LIMITS": {
      const budget = raw.adapter.budgets.find(
        (entry) => entry.id === "preview-plate",
      );
      if (budget === undefined) throw new Error("missing preview budget");
      (budget as { requiredBytes: number }).requiredBytes = 1;
      (budget as { allocatedBytes: number | null }).allocatedBytes = 1;
      return;
    }
    case "P5-LAYOUT-INDEXING":
      (blockingFixture(raw, "layout") as {
        comparisonFailureCount: number;
      }).comparisonFailureCount += 1;
      return;
    case "P5-DIFFUSION":
      (blockingFixture(raw, "diffusion") as {
        fieldFailureCount: number;
      }).fieldFailureCount += 1;
      return;
    case "P5-GG-THRESHOLD":
      (blockingFixture(raw, "gg") as {
        decisionFailureCount: number;
      }).decisionFailureCount += 1;
      return;
    case "P5-LIBBRECHT-KINETICS":
      (blockingFixture(raw, "lk") as {
        invariantFailureCount: number;
      }).invariantFailureCount += 1;
      return;
    case "P5-SYMMETRY": {
      const fixture = raw.fixtures.find(
        (entry) =>
          (entry.kind === "gg" || entry.kind === "lk") &&
          entry.symmetryChecked,
      );
      if (fixture === undefined) throw new Error("missing symmetry fixture");
      (fixture as { symmetryMismatchCount: number }).symmetryMismatchCount += 1;
      return;
    }
    case "P5-DOMAIN-SAFETY":
      (raw.fixtures[0] as { domainContact: boolean }).domainContact = true;
      return;
    case "P5-DISPATCH-SAFETY":
      (raw.submissions.samples[0].segmentWallMs as number[])[0] =
        PHASE5_PERFORMANCE.maxSubmissionSegmentMs + 1;
      return;
    case "P5-EDIT-ACK":
      (raw.interactions[0] as { editAcknowledgementMs: number })
        .editAcknowledgementMs =
          PHASE5_PERFORMANCE.editAcknowledgementMs + 1;
      return;
    case "P5-FIRST-VALID-FRAME":
      (raw.interactions[0] as { firstValidFrameMs: number })
        .firstValidFrameMs =
          PHASE5_PERFORMANCE.firstValidPostEditFrameMs + 1;
      return;
    case "P5-RESIDENCY":
      (raw.readback as { fullFieldDisplayFrameCount: number })
        .fullFieldDisplayFrameCount += 1;
      return;
    case "P5-CHECKPOINTS":
      (raw.checkpoints[0] as { gpuDecodePass: boolean }).gpuDecodePass = false;
      return;
    case "P5-NEGATIVE-CONTROLS":
      (raw as { toleranceBypassCount: number }).toleranceBypassCount += 1;
      return;
    case "P5-PUBLICATION":
      (raw as { publicationVerified: boolean }).publicationVerified = false;
      return;
  }
}

function evaluatePhase5LaneInternal(
  input: Phase5LaneRawEvidence,
  executeNegativeControls: boolean,
): Phase5LaneVerdict {
  const raw = validatePhase5RawEvidence(input);
  if (raw.schema !== PHASE5_RAW_EVIDENCE_SCHEMA) {
    throw new Error("Phase 5 raw evidence schema is invalid");
  }
  const fixtureIds = raw.fixtures.map((fixture) => fixture.id);
  if (new Set(fixtureIds).size !== fixtureIds.length) {
    throw new Error("Phase 5 fixture evidence has duplicate ids");
  }
  const expectedBlocking = PHASE5_FIXTURES.filter(
    (fixture) => fixture.blocking,
  ).map((fixture) => fixture.id);
  if (!exactStringSet(fixtureIds, expectedBlocking)) {
    throw new Error("Phase 5 blocking fixture inventory is incomplete");
  }
  const expectedStress = PHASE5_FIXTURES.filter(
    (fixture) => fixture.kind === "stress",
  );
  if (
    !exactStringSet(
      raw.stressDiagnostics.map((entry) => entry.id),
      expectedStress.map((entry) => entry.id),
    ) ||
    expectedStress.some((expected) => {
      const observed = raw.stressDiagnostics.find(
        (entry) => entry.id === expected.id,
      );
      return observed === undefined || observed.stress !== expected.stress;
    })
  ) {
    throw new Error("Phase 5 stress diagnostic inventory is incomplete");
  }

  const provenanceFailures: string[] = [];
  if (!raw.repository.clean) provenanceFailures.push("repository is dirty");
  if (!/^[0-9a-f]{40}$/.test(raw.repository.commit)) {
    provenanceFailures.push("repository commit is not a full lowercase object id");
  }
  if (raw.host.platform !== "win32") provenanceFailures.push("host is not Windows");
  if (
    raw.host.architecture !== "x64" ||
    raw.host.release.trim().length === 0 ||
    raw.host.cpu !== "AMD Ryzen 7 5700G with Radeon Graphics" ||
    raw.host.logicalProcessors !== 16 ||
    !Number.isSafeInteger(raw.host.totalMemoryBytes) ||
    raw.host.totalMemoryBytes < 64_000_000_000
  ) {
    provenanceFailures.push("host identity differs from the registered Windows machine");
  }
  if (raw.adapter.backend !== PHASE5_EXPECTED_WINDOWS_BACKEND) {
    provenanceFailures.push("observed backend is not D3D12");
  }
  if (
    raw.adapter.vendor.toLowerCase() !== "nvidia" ||
    raw.adapter.architecture.toLowerCase() !== "ampere" ||
    raw.adapter.device.toLowerCase() !== "0x2206" ||
    raw.adapter.description !== "NVIDIA GeForce RTX 3080" ||
    raw.adapter.type !== "discrete GPU" ||
    raw.adapter.driver !== "D3D12 driver version 32.0.15.9186"
  ) {
    provenanceFailures.push("adapter identity differs from the registered RTX 3080");
  }
  if (
    raw.runtime.name !== PHASE5_HEADLESS_RUNTIME ||
    raw.runtime.version !== PHASE5_HEADLESS_RUNTIME_VERSION ||
    raw.runtime.product !== "Chrome/149.0.7827.55" ||
    raw.runtime.revision !==
      "@3188f8a607ae7e067593be8aab7f02d2451fec07" ||
    !/[\\/]chromium-1228[\\/]chrome-win64[\\/]chrome\.exe$/i.test(
      raw.runtime.executablePath,
    ) ||
    !exactStringSet(raw.runtime.launchFlags, [
      "--enable-unsafe-webgpu",
      "--enable-webgpu-developer-features",
    ])
  ) {
    provenanceFailures.push("runtime identity differs from the frozen Chromium");
  }

  const protocolFailures: string[] = [];
  if (raw.protocol.id !== PHASE5_PROTOCOL) protocolFailures.push("protocol id differs");
  if (raw.protocol.sha256 !== PHASE5_PROTOCOL_SHA256) {
    protocolFailures.push("protocol hash differs");
  }
  if (raw.protocol.fixtureSha256 !== PHASE5_FIXTURES_SHA256) {
    protocolFailures.push("fixture hash differs");
  }
  if (raw.protocol.toleranceSha256 !== PHASE5_TOLERANCES_SHA256) {
    protocolFailures.push("tolerance hash differs");
  }
  const frozenProtocolManifest = strictJsonSnapshot(phase5ProtocolManifest());
  const frozenFixtureManifest = strictJsonSnapshot(phase5FixtureManifest());
  const frozenToleranceManifest = strictJsonSnapshot(phase5ToleranceManifest());
  for (const [name, observed, expected, suppliedHash] of [
    [
      "protocol",
      raw.protocol.manifest,
      frozenProtocolManifest,
      raw.protocol.sha256,
    ],
    [
      "fixture",
      raw.protocol.fixtureManifest,
      frozenFixtureManifest,
      raw.protocol.fixtureSha256,
    ],
    [
      "tolerance",
      raw.protocol.toleranceManifest,
      frozenToleranceManifest,
      raw.protocol.toleranceSha256,
    ],
  ] as const) {
    if (canonicalJson(observed) !== canonicalJson(expected)) {
      protocolFailures.push(`${name} manifest differs`);
    }
    if (canonicalJsonSha256(observed) !== suppliedHash) {
      protocolFailures.push(`${name} manifest hash was not recomputed`);
    }
  }

  const limitFailures: string[] = [];
  if (
    !PHASE5_REQUIRED_FEATURES.every((feature) =>
      raw.adapter.features.includes(feature),
    )
  ) {
    limitFailures.push("adapter omits a required feature");
  }
  if (
    !exactStringSet(raw.adapter.requestedFeatures, PHASE5_REQUIRED_FEATURES)
  ) {
    limitFailures.push("requested feature set differs from the freeze");
  }
  for (const [name, required] of Object.entries(PHASE5_REQUIRED_LIMITS)) {
    const adapterValue = raw.adapter.limits[name];
    const requestedValue = raw.adapter.requestedLimits[name];
    const deviceValue = raw.adapter.deviceLimits[name];
    if (!Number.isFinite(adapterValue) || adapterValue < required) {
      limitFailures.push(`adapter ${name} is below ${required}`);
    }
    if (!Number.isFinite(deviceValue) || deviceValue < required) {
      limitFailures.push(`device ${name} is below ${required}`);
    }
    if (requestedValue !== required) {
      limitFailures.push(`requested ${name} differs from ${required}`);
    }
  }
  if (
    !exactStringSet(
      Object.keys(raw.adapter.requestedLimits),
      Object.keys(PHASE5_REQUIRED_LIMITS),
    )
  ) {
    limitFailures.push("requested limit inventory differs from the freeze");
  }
  const budgetIds = raw.adapter.budgets.map((budget) => budget.id);
  if (
    !exactStringSet(
      budgetIds,
      PHASE5_BUDGETS.map((budget) => budget.id),
    )
  ) {
    limitFailures.push("budget inventory differs from the frozen protocol");
  }
  for (const frozen of PHASE5_BUDGETS) {
    const observed = raw.adapter.budgets.find((budget) => budget.id === frozen.id);
    if (observed === undefined) continue;
    const cellCount = frozen.dims.nx * frozen.dims.ny * frozen.dims.nz;
    const requiredBytes = cellCount * 64;
    const planningCeilingBytes = requiredBytes + 256 * 1024 * 1024;
    if (
      observed.disposition !== frozen.disposition ||
      observed.requiredBytes !== requiredBytes ||
      observed.planningCeilingBytes !== planningCeilingBytes
    ) {
      limitFailures.push(`${frozen.id} budget declaration differs`);
      continue;
    }
    if (
      observed.supported &&
      (!observed.allocated ||
        observed.allocatedBytes !== observed.requiredBytes ||
        observed.failureReason !== null)
    ) {
      limitFailures.push(`${frozen.id} supported budget did not allocate exactly`);
    }
    if (
      !observed.supported &&
      (observed.allocated ||
        observed.allocatedBytes !== null ||
        observed.failureReason === null ||
        observed.failureReason.trim().length === 0)
    ) {
      limitFailures.push(`${frozen.id} unsupported budget did not fail clearly`);
    }
    if (frozen.disposition === "blocking" && !observed.supported) {
      limitFailures.push(`${frozen.id} blocking budget is unsupported`);
    }
  }

  const symmetryFailures: string[] = [];
  const fixtureById = new Map(raw.fixtures.map((fixture) => [fixture.id, fixture]));
  for (const fixture of PHASE5_FIXTURES) {
    if (
      !fixture.blocking ||
      !("noiseEpsilon" in fixture) ||
      fixture.noiseEpsilon !== 0 ||
      (fixture.kind !== "gg" && fixture.kind !== "lk")
    ) {
      continue;
    }
    const measurement = fixtureById.get(fixture.id);
    if (
      measurement === undefined ||
      !measurement.symmetryChecked ||
      measurement.symmetryMismatchCount !== 0
    ) {
      symmetryFailures.push(`${fixture.id} lacks exact noise-off symmetry`);
    }
  }

  const domainFailures: string[] = [];
  for (const fixture of raw.fixtures) {
    if (fixture.domainContact) domainFailures.push(`${fixture.id} contacts its domain`);
  }

  const expectedSubmissionKeys = PHASE5_PERFORMANCE.previewCases.flatMap(
    (budgetId) => [
      ...Array.from(
        { length: PHASE5_PERFORMANCE.warmupCount },
        (_, sample) => `${budgetId}:warmup:${sample}`,
      ),
      ...Array.from(
        { length: PHASE5_PERFORMANCE.sampleCount },
        (_, sample) => `${budgetId}:sample:${sample}`,
      ),
    ],
  );
  const submissionKeys = raw.submissions.samples.map(
    (entry) =>
      `${entry.budgetId}:${entry.warmup ? "warmup" : "sample"}:${entry.sample}`,
  );
  const dispatchFailures: string[] = [];
  if (!exactStringSet(submissionKeys, expectedSubmissionKeys)) {
    dispatchFailures.push("submission warmup/sample inventory is incomplete");
  }
  const allSegments: number[] = [];
  const p99ByBudget: Record<string, number> = {};
  for (const entry of raw.submissions.samples) {
    if (entry.segmentWallMs.length === 0) {
      dispatchFailures.push(
        `${entry.budgetId}:${entry.sample} has no bounded submission segment`,
      );
      continue;
    }
    const segments = entry.segmentWallMs.map((value, index) =>
      finiteNonnegative(
        value,
        `${entry.budgetId}:${entry.sample}.segmentWallMs[${index}]`,
      ),
    );
    allSegments.push(...segments);
    if (
      segments.some(
        (value) => value > PHASE5_PERFORMANCE.maxSubmissionSegmentMs,
      )
    ) {
      dispatchFailures.push(
        `${entry.budgetId}:${entry.sample} exceeds the maximum segment bound`,
      );
    }
  }
  for (const budgetId of PHASE5_PERFORMANCE.previewCases) {
    const measured = raw.submissions.samples
      .filter((entry) => entry.budgetId === budgetId && !entry.warmup)
      .map((entry) => Math.max(...entry.segmentWallMs))
      .sort((left, right) => left - right);
    const p99 =
      measured[Math.max(0, Math.ceil(measured.length * 0.99) - 1)] ??
      Number.POSITIVE_INFINITY;
    p99ByBudget[budgetId] = p99;
    if (p99 > PHASE5_PERFORMANCE.p99SubmissionSegmentMs) {
      dispatchFailures.push(`${budgetId} submission p99 exceeds its bound`);
    }
  }
  const maximum = Math.max(0, ...allSegments);
  for (const [name, value] of [
    ["deviceLossCount", raw.submissions.deviceLossCount],
    ["uncapturedErrorCount", raw.submissions.uncapturedErrorCount],
    ["hiddenRetryCount", raw.submissions.hiddenRetryCount],
  ] as const) {
    count(value, `submissions.${name}`);
    if (value !== 0) dispatchFailures.push(`${name} is ${value}`);
  }

  const expectedInteractionCount =
    PHASE5_PERFORMANCE.previewCases.length *
    PHASE5_PERFORMANCE.sampleCount;
  const interactionKeys = raw.interactions.map(
    (entry) => `${entry.budgetId}:${entry.sample}`,
  );
  const interactionInventoryPass =
    raw.interactions.length === expectedInteractionCount &&
    new Set(interactionKeys).size === expectedInteractionCount &&
    PHASE5_PERFORMANCE.previewCases.every((budgetId) =>
      Array.from(
        { length: PHASE5_PERFORMANCE.sampleCount },
        (_, sample) => `${budgetId}:${sample}`,
      ).every((key) => interactionKeys.includes(key)),
    );
  const editFailures: string[] = [];
  const frameFailures: string[] = [];
  if (!interactionInventoryPass) {
    editFailures.push("interaction sample inventory is incomplete");
    frameFailures.push("interaction sample inventory is incomplete");
  }
  for (const entry of raw.interactions) {
    finiteNonnegative(
      entry.editAcknowledgementMs,
      `${entry.budgetId}:${entry.sample}.editAcknowledgementMs`,
    );
    finiteNonnegative(
      entry.firstValidFrameMs,
      `${entry.budgetId}:${entry.sample}.firstValidFrameMs`,
    );
    if (entry.editAcknowledgementMs > PHASE5_PERFORMANCE.editAcknowledgementMs) {
      editFailures.push(`${entry.budgetId}:${entry.sample} acknowledgement is late`);
    }
    if (entry.acceptedGeneration !== entry.editGeneration) {
      editFailures.push(`${entry.budgetId}:${entry.sample} accepted a stale generation`);
    }
    if (entry.firstValidFrameMs > PHASE5_PERFORMANCE.firstValidPostEditFrameMs) {
      frameFailures.push(`${entry.budgetId}:${entry.sample} first valid frame is late`);
    }
    if (entry.renderedGeneration !== entry.editGeneration) {
      frameFailures.push(`${entry.budgetId}:${entry.sample} rendered a stale generation`);
    }
  }

  const residencyFailures: string[] = [];
  count(
    raw.readback.fullFieldDisplayFrameCount,
    "readback.fullFieldDisplayFrameCount",
  );
  if (
    raw.readback.fullFieldDisplayFrameCount !==
    PHASE5_PERFORMANCE.permittedFullFieldReadbacksPerDisplayFrame
  ) {
    residencyFailures.push("display rendering performed a full-field readback");
  }
  const readbackTotalBytes = raw.readback.records.reduce((sum, entry, index) => {
    for (const [name, value] of [
      ["sequence", entry.sequence],
      ["generation", entry.generation],
      ["sourceId", entry.sourceId],
      ["byteOffset", entry.byteOffset],
      ["byteLength", entry.byteLength],
      ["sourceByteLength", entry.sourceByteLength],
    ] as const) {
      count(value, `readback.records[${index}].${name}`);
    }
    if (
      entry.sequence !== index ||
      !expectedBlocking.includes(entry.fixtureId) ||
      ![
        "test",
        "named-probe",
        "compact-metric",
        "evidence-snapshot",
        "checkpoint",
      ].includes(entry.purpose) ||
      entry.label.length === 0 ||
      entry.byteLength === 0 ||
      entry.byteOffset + entry.byteLength > entry.sourceByteLength ||
      entry.fullField !==
        (entry.byteOffset === 0 && entry.byteLength === entry.sourceByteLength) ||
      entry.displayFrame !== (entry.displayFrameSequence !== null) ||
      entry.displayFrame !== (entry.displayFrameLabel !== null)
    ) {
      residencyFailures.push(`readback record ${index} is internally inconsistent`);
    }
    return sum + entry.byteLength;
  }, 0);
  const recomputedFullFieldDisplayFrames = raw.readback.records.filter(
    (entry) => entry.fullField && entry.displayFrame,
  ).length;
  if (
    recomputedFullFieldDisplayFrames !==
      raw.readback.fullFieldDisplayFrameCount ||
    readbackTotalBytes !== raw.readback.totalBytes
  ) {
    residencyFailures.push("readback summary differs from its complete audit");
  }
  if (raw.readback.records.length === 0) {
    residencyFailures.push("readback audit is empty");
  }

  const checkpointFailures: string[] = [];
  const checkpointIds = raw.checkpoints.map((entry) => entry.fixtureId);
  if (!exactStringSet(checkpointIds, expectedBlocking)) {
    checkpointFailures.push("checkpoint fixture inventory is incomplete");
  }
  for (const checkpoint of raw.checkpoints) {
    const fixture = PHASE5_FIXTURES.find(
      (candidate) => candidate.id === checkpoint.fixtureId,
    );
    const expectedCodec = fixture?.kind === "lk" ? "lk-v2" : "gg-v1";
    if (checkpoint.codec !== expectedCodec) {
      checkpointFailures.push(`${checkpoint.fixtureId} codec differs`);
    }
    if (!checkpoint.cpuDecodePass || !checkpoint.gpuDecodePass) {
      checkpointFailures.push(`${checkpoint.fixtureId} checkpoint decode failed`);
    }
    for (const [name, value] of [
      ["occupancyMismatchCount", checkpoint.occupancyMismatchCount],
      ["metadataMismatchCount", checkpoint.metadataMismatchCount],
      [
        "float32RoundTripMismatchCount",
        checkpoint.float32RoundTripMismatchCount,
      ],
    ] as const) {
      count(value, `${checkpoint.fixtureId}.${name}`);
      if (value !== 0) checkpointFailures.push(`${checkpoint.fixtureId} has ${name}`);
    }
    if (
      checkpoint.scalarType !== "float32" ||
      checkpoint.endianness !== "little-endian"
    ) {
      checkpointFailures.push(`${checkpoint.fixtureId} conversion declaration differs`);
    }
  }

  const negativeFailures: string[] = [];
  count(raw.toleranceBypassCount, "toleranceBypassCount");
  if (raw.toleranceBypassCount !== 0) {
    negativeFailures.push("a blocking tolerance bypass was accepted");
  }
  const controlIds = raw.negativeControls.map((control) => control.id);
  if (
    !exactStringSet(
      controlIds,
      PHASE5_NEGATIVE_CONTROLS.map((control) => control.id),
    )
  ) {
    negativeFailures.push("negative-control inventory differs");
  }
  for (const expected of PHASE5_NEGATIVE_CONTROLS) {
    const observed = raw.negativeControls.find(
      (control) => control.id === expected.id,
    );
    if (
      observed === undefined ||
      observed.owner !== expected.owner ||
      observed.mutation !== expected.mutation ||
      !observed.rejected ||
      observed.failedCriteria.length === 0 ||
      !observed.failedCriteria.includes(expected.owner)
    ) {
      // ADR 0022: the observed failing set must contain the registered owner. Demanding it be
      // exactly the owner was satisfiable only by asserting a singleton, which is why the
      // producer hardcoded `[control.owner]`. A mutation applied at a real boundary corrupts
      // real, cross-linked evidence, so more than one criterion may legitimately notice.
      negativeFailures.push(
        `${expected.id} was not observed to fail ${expected.owner}`,
      );
    }
  }
  const hasFixtureFailure = raw.fixtures.some(
    (fixture) =>
      fixture.comparisonFailureCount !== 0 ||
      fixture.fieldFailureCount !== 0 ||
      fixture.scalarFailureCount !== 0 ||
      fixture.decisionFailureCount !== 0 ||
      fixture.invariantFailureCount !== 0 ||
      !fixture.stopReasonMatch,
  );
  const baselineCandidate =
    raw.publicationVerified &&
    !hasFixtureFailure &&
    [
      provenanceFailures,
      protocolFailures,
      limitFailures,
      symmetryFailures,
      domainFailures,
      dispatchFailures,
      editFailures,
      frameFailures,
      residencyFailures,
      checkpointFailures,
      negativeFailures,
    ].every((failures) => failures.length === 0);
  if (executeNegativeControls && baselineCandidate) {
    for (const expected of PHASE5_NEGATIVE_CONTROLS) {
      const mutated = structuredClone(raw);
      applyPhase5CriterionMutation(expected.owner, mutated);
      const verdict = evaluatePhase5LaneInternal(mutated, false);
      const failures = verdict.criteria
        .filter((criterion) => !criterion.pass)
        .map((criterion) => criterion.id);
      if (
        failures.length !== 1 ||
        failures[0] !== expected.owner
      ) {
        negativeFailures.push(
          `${expected.id} independent evaluator mutation does not fail only ${expected.owner}`,
        );
      }
    }
  }

  const criteria = [
    result("P5-WINDOWS-PROVENANCE", provenanceFailures, {
      repository: raw.repository,
      host: raw.host,
      runtime: raw.runtime,
      adapter: {
        vendor: raw.adapter.vendor,
        architecture: raw.adapter.architecture,
        device: raw.adapter.device,
        description: raw.adapter.description,
        backend: raw.adapter.backend,
        type: raw.adapter.type,
        driver: raw.adapter.driver,
      },
    }),
    result("P5-PROTOCOL-MATCH", protocolFailures, raw.protocol),
    result("P5-ADAPTER-LIMITS", limitFailures, {
      features: raw.adapter.features,
      adapterLimits: raw.adapter.limits,
      deviceLimits: raw.adapter.deviceLimits,
      budgets: raw.adapter.budgets,
    }),
    result(
      "P5-LAYOUT-INDEXING",
      fixtureFailures(raw.fixtures, "layout"),
      raw.fixtures.filter((fixture) => fixture.kind === "layout"),
    ),
    result(
      "P5-DIFFUSION",
      fixtureFailures(raw.fixtures, "diffusion"),
      raw.fixtures.filter((fixture) => fixture.kind === "diffusion"),
    ),
    result(
      "P5-GG-THRESHOLD",
      fixtureFailures(raw.fixtures, "gg"),
      raw.fixtures.filter((fixture) => fixture.kind === "gg"),
    ),
    result(
      "P5-LIBBRECHT-KINETICS",
      fixtureFailures(raw.fixtures, "lk"),
      raw.fixtures.filter((fixture) => fixture.kind === "lk"),
    ),
    result("P5-SYMMETRY", symmetryFailures, {
      fixtures: raw.fixtures.map((fixture) => ({
        id: fixture.id,
        checked: fixture.symmetryChecked,
        mismatchCount: fixture.symmetryMismatchCount,
      })),
    }),
    result("P5-DOMAIN-SAFETY", domainFailures, {
      contacts: raw.fixtures
        .filter((fixture) => fixture.domainContact)
        .map((fixture) => fixture.id),
    }),
    result("P5-DISPATCH-SAFETY", dispatchFailures, {
      sampleCount: raw.submissions.samples.length,
      segmentCount: allSegments.length,
      maximumMs: maximum,
      p99ByBudget,
      deviceLossCount: raw.submissions.deviceLossCount,
      uncapturedErrorCount: raw.submissions.uncapturedErrorCount,
      hiddenRetryCount: raw.submissions.hiddenRetryCount,
    }),
    result("P5-EDIT-ACK", editFailures, {
      count: raw.interactions.length,
      maximumMs: Math.max(
        0,
        ...raw.interactions.map((entry) => entry.editAcknowledgementMs),
      ),
    }),
    result("P5-FIRST-VALID-FRAME", frameFailures, {
      count: raw.interactions.length,
      maximumMs: Math.max(
        0,
        ...raw.interactions.map((entry) => entry.firstValidFrameMs),
      ),
    }),
    result("P5-RESIDENCY", residencyFailures, raw.readback),
    result("P5-CHECKPOINTS", checkpointFailures, raw.checkpoints),
    result("P5-NEGATIVE-CONTROLS", negativeFailures, {
      toleranceBypassCount: raw.toleranceBypassCount,
      controls: raw.negativeControls,
    }),
    result(
      "P5-PUBLICATION",
      raw.publicationVerified ? [] : ["publication graph is not verified"],
      { verified: raw.publicationVerified },
    ),
  ] satisfies readonly Phase5CriterionResult[];

  if (
    criteria.length !== PHASE5_CRITERIA.length ||
    criteria.some((entry, index) => entry.id !== PHASE5_CRITERIA[index])
  ) {
    throw new Error("Phase 5 criterion evaluator order differs from the freeze");
  }
  const byId = criterionMap(criteria);
  if (byId.size !== PHASE5_CRITERIA.length) {
    throw new Error("Phase 5 criterion evaluator emitted duplicates");
  }
  const gatePass = criteria.every((entry) => entry.pass);
  return { criteria, gatePass, exitCode: gatePass ? 0 : 1 };
}

export function evaluatePhase5Lane(
  input: Phase5LaneRawEvidence,
): Phase5LaneVerdict {
  return evaluatePhase5LaneInternal(input, true);
}

export function failedPhase5Criteria(
  verdict: Phase5LaneVerdict,
): readonly Phase5Criterion[] {
  return verdict.criteria
    .filter((criterion) => !criterion.pass)
    .map((criterion) => criterion.id);
}
