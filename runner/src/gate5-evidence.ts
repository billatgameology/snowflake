// Phase 5 canonical lane publication and reopening.
//
// The index is the commit marker. Payloads are written into a private sibling directory,
// reopened and verified against an immutable in-memory root, and published by one directory
// rename. The aggregate gate uses the same verifier and never trusts a lane report's booleans.

import { randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import {
  GG_PRESETS,
  decodeCheckpoint,
  decodeLKCheckpoint,
} from "@vcc/core";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import {
  evaluatePhase5Lane,
  validatePhase5RawEvidence,
  type Phase5CheckpointMeasurement,
  type Phase5LaneRawEvidence,
  type Phase5LaneVerdict,
} from "./gate5-protocol.ts";
import {
  PHASE5_EVIDENCE_SCHEMA,
  PHASE5_FIXTURES,
  PHASE5_FIXTURES_SHA256,
  PHASE5_FIELD_TOLERANCES,
  PHASE5_PROTOCOL,
  PHASE5_PROTOCOL_SHA256,
  PHASE5_SCALAR_TOLERANCES,
  PHASE5_TOLERANCES_SHA256,
} from "./phase5-protocol.ts";
import {
  comparePhase5Arrays,
  phase5ComparisonPasses,
} from "./phase5-shadow.ts";

export const PHASE5_LANE_MANIFEST_PATH = "lane-manifest.json";
export const PHASE5_LANE_REPORT_PATH = "lane-report.json";
export const PHASE5_LANE_INDEX_PATH = "artifact-index.json";

const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const SHA256 = /^[0-9a-f]{64}$/;

export interface Phase5ArtifactDescriptor {
  readonly path: string;
  readonly kind: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase5SourceHash {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase5FixtureCapture {
  readonly id: string;
  readonly config: unknown;
  readonly cpuReferenceCheckpoint: Uint8Array;
  readonly gpuExportCheckpoint: Uint8Array;
  readonly comparison: unknown;
  readonly events: unknown;
  readonly timing: unknown;
  readonly readback: unknown;
}

export interface Phase5LaneCapture {
  readonly startedAtUtc: string;
  readonly completedAtUtc: string;
  readonly raw: Phase5LaneRawEvidence;
  readonly fixtures: readonly Phase5FixtureCapture[];
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
  readonly exitStatus: 0;
}

export interface Phase5LaneManifest {
  readonly schema: typeof PHASE5_EVIDENCE_SCHEMA.laneManifest;
  readonly lane: "windows-d3d12";
  readonly protocol: typeof PHASE5_PROTOCOL;
  readonly protocolSha256: typeof PHASE5_PROTOCOL_SHA256;
  readonly fixtureSha256: typeof PHASE5_FIXTURES_SHA256;
  readonly toleranceSha256: typeof PHASE5_TOLERANCES_SHA256;
  readonly repository: Phase5LaneRawEvidence["repository"];
  readonly host: Phase5LaneRawEvidence["host"];
  readonly runtime: Phase5LaneRawEvidence["runtime"];
  readonly adapter: Phase5LaneRawEvidence["adapter"];
  readonly startedAtUtc: string;
  readonly completedAtUtc: string;
  readonly sourceHashes: readonly Phase5SourceHash[];
  readonly artifacts: readonly Phase5ArtifactDescriptor[];
}

export interface Phase5LaneReport {
  readonly schema: typeof PHASE5_EVIDENCE_SCHEMA.laneReport;
  readonly lane: "windows-d3d12";
  readonly manifestSha256: string;
  readonly raw: Phase5LaneRawEvidence;
  readonly criteria: Phase5LaneVerdict["criteria"];
  readonly gatePass: boolean;
  readonly exitCode: 0 | 1;
}

export interface Phase5LaneArtifactIndex {
  readonly schema: typeof PHASE5_EVIDENCE_SCHEMA.artifactIndex;
  readonly publication: "complete";
  readonly manifest: Phase5ArtifactDescriptor;
  readonly report: Phase5ArtifactDescriptor;
  readonly artifacts: readonly Phase5ArtifactDescriptor[];
}

export interface VerifiedPhase5LaneBundle {
  readonly directory: string;
  readonly manifest: Phase5LaneManifest;
  readonly report: Phase5LaneReport;
  readonly index: Phase5LaneArtifactIndex;
}

export interface Phase5LanePublicationHooks {
  readonly afterArtifactWrite?: (path: string, stagingDirectory: string) => void;
  readonly beforeRename?: (stagingDirectory: string) => void;
  readonly afterRename?: (canonicalDirectory: string) => void;
}

export interface Phase5LaneVerificationHooks {
  /**
   * Test-only size seam. Production callers omit it and decode both existing checkpoint
   * codecs with @vcc/core before a bundle can verify.
   */
  readonly verifyCheckpointPair?: (
    fixture: (typeof PHASE5_FIXTURES)[number],
    cpuBytes: Uint8Array,
    gpuBytes: Uint8Array,
  ) => Phase5CheckpointVerification;
}

export interface Phase5FieldComparisonEvidence {
  readonly name: "d" | "b" | "sigma" | "f";
  readonly tolerance:
    | "diffusionD"
    | "ggBoundaryMass"
    | "ggVapor"
    | "lkSigma"
    | "lkFill";
  readonly length: number;
  readonly maxAbs: number;
  readonly rms: number;
  readonly maxRelative: number;
  readonly relativeComparedCount: number;
}

export interface Phase5CheckpointVerification {
  readonly checkpoint: Phase5CheckpointMeasurement;
  readonly fields: readonly Phase5FieldComparisonEvidence[];
}

export interface PublishPhase5LaneOptions {
  readonly canonicalDirectory: string;
  readonly capture: Phase5LaneCapture;
  readonly sourceHashes: readonly Phase5SourceHash[];
  readonly attemptId?: string;
  readonly hooks?: Phase5LanePublicationHooks;
  readonly verificationHooks?: Phase5LaneVerificationHooks;
}

interface ArtifactInput {
  readonly path: string;
  readonly kind: string;
  readonly bytes: Uint8Array;
}

interface ExpectedFile {
  readonly path: string;
  readonly bytes: Uint8Array;
}

interface OwnedDirectoryIdentity {
  readonly dev: bigint;
  readonly ino: bigint;
  readonly realPath: string;
}

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function directoryIdentity(path: string, label: string): OwnedDirectoryIdentity {
  const metadata = lstatSync(path, { bigint: true });
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`${label} is not an independent directory`);
  }
  const realPath = realpathSync.native(path);
  if (resolve(realPath) !== resolve(path)) {
    throw new Error(`${label} resolves through an alias or junction`);
  }
  return { dev: metadata.dev, ino: metadata.ino, realPath };
}

function assertDirectoryIdentity(
  path: string,
  identity: OwnedDirectoryIdentity,
  label: string,
): void {
  const current = directoryIdentity(path, label);
  if (
    current.dev !== identity.dev ||
    current.ino !== identity.ino ||
    current.realPath !== identity.realPath
  ) {
    throw new Error(`${label} identity changed`);
  }
}

function removeOwnedDirectory(
  path: string,
  identity: OwnedDirectoryIdentity,
): void {
  if (!existsSync(path)) return;
  assertDirectoryIdentity(path, identity, "Phase 5 owned publication directory");
  rmSync(path, { recursive: true, force: true });
}

function exactKeys(
  value: Readonly<Record<string, StrictJson>>,
  expected: readonly string[],
  label: string,
): void {
  const actual = Object.keys(value).sort(lexical);
  const wanted = [...expected].sort(lexical);
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    throw new Error(`${label} keys are invalid`);
  }
}

function plainObject(value: unknown, label: string): Readonly<Record<string, StrictJson>> {
  const snapshot = strictJsonSnapshot(value);
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error(`${label} must be an object`);
  }
  return snapshot as Readonly<Record<string, StrictJson>>;
}

function safePath(path: string): void {
  if (
    !SAFE_PATH.test(path) ||
    path.includes("\\") ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`unsafe Phase 5 artifact path: ${path}`);
  }
}

function descriptor(input: ArtifactInput): Phase5ArtifactDescriptor {
  safePath(input.path);
  if (input.kind.trim().length === 0) throw new Error(`${input.path} kind is empty`);
  return {
    path: input.path,
    kind: input.kind,
    byteLength: input.bytes.byteLength,
    sha256: sha256Bytes(input.bytes),
  };
}

function assertDescriptor(value: unknown, label: string): Phase5ArtifactDescriptor {
  const object = plainObject(value, label);
  exactKeys(object, ["path", "kind", "byteLength", "sha256"], label);
  const path = object.path;
  const kind = object.kind;
  const byteLength = object.byteLength;
  const sha256 = object.sha256;
  if (typeof path !== "string") throw new Error(`${label}.path must be a string`);
  safePath(path);
  if (typeof kind !== "string" || kind.trim().length === 0) {
    throw new Error(`${label}.kind is invalid`);
  }
  if (!Number.isSafeInteger(byteLength) || (byteLength as number) < 0) {
    throw new Error(`${label}.byteLength is invalid`);
  }
  if (typeof sha256 !== "string" || !SHA256.test(sha256)) {
    throw new Error(`${label}.sha256 is invalid`);
  }
  return { path, kind, byteLength: byteLength as number, sha256 };
}

function utf8Text(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decodeUtf8WithoutBom(bytes: Uint8Array, label: string): string {
  if (
    bytes.byteLength >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    throw new Error(`${label} must not contain a UTF-8 BOM`);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function canonicalArtifact(path: string, kind: string, value: unknown): ArtifactInput {
  return { path, kind, bytes: canonicalJsonBytes(value) };
}

function fixturePath(id: string, name: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`invalid fixture id: ${id}`);
  return `fixtures/${id}/${name}`;
}

function expectedLaneArtifactContracts(): readonly {
  readonly path: string;
  readonly kind: string;
}[] {
  const payload = [
    { path: "exit-status.txt", kind: "utf8-exit-status" },
    { path: "stderr.log", kind: "utf8-log" },
    { path: "stdout.log", kind: "utf8-log" },
    ...PHASE5_FIXTURES.flatMap((fixture) =>
      !fixture.blocking ? [] : [
        {
          path: fixturePath(fixture.id, "config.json"),
          kind: "phase5-fixture-config+json",
        },
        {
          path: fixturePath(fixture.id, "cpu-reference.ckpt"),
          kind:
            fixture.kind === "lk"
              ? "vcc-lk-v2-checkpoint"
              : "vcc-gg-v1-checkpoint",
        },
        {
          path: fixturePath(fixture.id, "gpu-export.ckpt"),
          kind:
            fixture.kind === "lk"
              ? "vcc-lk-v2-checkpoint"
              : "vcc-gg-v1-checkpoint",
        },
        {
          path: fixturePath(fixture.id, "comparison.json"),
          kind: "phase5-comparison+json",
        },
        {
          path: fixturePath(fixture.id, "events.json"),
          kind: "phase5-events+json",
        },
        {
          path: fixturePath(fixture.id, "timing.json"),
          kind: "phase5-timing+json",
        },
        {
          path: fixturePath(fixture.id, "readback.json"),
          kind: "phase5-readback+json",
        },
      ],
    ),
  ].sort((left, right) => lexical(left.path, right.path));
  return [
    {
      path: PHASE5_LANE_MANIFEST_PATH,
      kind: "phase5-lane-manifest+json",
    },
    {
      path: PHASE5_LANE_REPORT_PATH,
      kind: "phase5-lane-report+json",
    },
    ...payload,
  ];
}

function strictArray(value: StrictJson, label: string): readonly StrictJson[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

export const PHASE5_SCIENCE_INVENTORY = {
  layout: {
    scalars: [],
    decisions: [
      "checkpoint.metadata",
      "layout.active-mask",
      "layout.field-offsets",
      "layout.index-round-trip",
      "layout.ping-pong-ownership",
      "stop.reason",
    ],
    invariants: [],
    events: ["layout-round-trip", "stop"],
  },
  diffusion: {
    scalars: [],
    decisions: [
      "checkpoint.metadata",
      "noise.witness",
      "state.active-mask",
      "state.boundary-membership-order",
      "state.far-field-set",
      "state.neighbor-counts",
      "state.occupancy",
      "state.ping-pong-ownership",
      "state.stage-hashes",
      "state.wall-mask",
      "stop.reason",
    ],
    invariants: [
      "domain.no-contact",
    ],
    events: ["diffusion-passes", "noise-witness", "stop"],
  },
  gg: {
    scalars: [
      "ledger.dirichlet-meter",
      "ledger.total-mass-bd",
      "metrics.aspect-ratio",
      "metrics.bounding-radius",
      "metrics.branch-count",
      "metrics.cross-section-hollowness",
      "metrics.depletion-center",
      "metrics.depletion-ratio",
      "metrics.depletion-rim",
      "metrics.far-field-vapor",
      "metrics.sealed-void-fraction",
      "metrics.total-mass",
      "relaxation.residual",
      "relaxation.shell-clamp",
      "relaxation.surface-exchange",
      "relaxation.sweeps",
      "state.boundary-mass-total",
      "state.vapor-total",
      "surface.frozen-amount",
      "surface.melted-amount",
    ],
    decisions: [
      "checkpoint.metadata",
      "identity.controls",
      "metrics.occupancy",
      "noise.witness",
      "reports.ledger-rule",
      "reports.relaxation-classification",
      "reports.surface-discrete",
      "state.active-mask",
      "state.attached-count",
      "state.boundary-membership-order",
      "state.bounds",
      "state.cycle-phase",
      "state.domain-extents",
      "state.far-field-set",
      "state.last-attachment-delta",
      "state.neighbor-counts",
      "state.occupancy",
      "state.render-flags",
      "state.wall-mask",
      "stop.reason",
      "timeline.records",
    ],
    invariants: [
      "decision.gg-margin",
      "domain.no-contact",
      "mass.reflecting-or-corrected",
      "symmetry.exact",
    ],
    events: [
      "attachment-delta-log",
      "cycle-boundary-log",
      "noise-witness",
      "stop",
    ],
  },
  lk: {
    scalars: [
      "identity.sim-time-seconds",
      "ledger.closed-placed-fill-vapor-units",
      "ledger.current-temperature-segment-m-ice",
      "ledger.current-temperature-segment-start-fill",
      "ledger.fill-ice-cells",
      "ledger.fill-vapor-units",
      "ledger.hole-fill-deficit",
      "ledger.kinetic-demand",
      "ledger.last-divergence-residual",
      "ledger.saturation-clipped-fill",
      "metrics.aspect-ratio",
      "metrics.bounding-radius",
      "metrics.branch-count",
      "metrics.cross-section-hollowness",
      "metrics.depletion-center",
      "metrics.depletion-ratio",
      "metrics.depletion-rim",
      "metrics.far-field-vapor",
      "metrics.sealed-void-fraction",
      "relaxation.divergence-residual",
      "relaxation.maximum-current-step-ulp",
      "relaxation.maximum-two-back-ulp",
      "relaxation.min-local-exchange",
      "relaxation.residual",
      "relaxation.shell-clamp",
      "relaxation.smoother-drift",
      "relaxation.smoother-drift-bound",
      "relaxation.surface-exchange",
      "relaxation.sweeps",
      "scales.c-sat",
      "scales.kinetic-length",
      "scales.m-ice",
      "scales.v-kin",
      "surface.delta-time-seconds",
      "surface.hole-fill-deficit",
      "surface.kinetic-demand",
      "surface.max-kinetic-fill",
      "surface.partition-error",
      "surface.placed-fill",
      "surface.saturation-clipped-fill",
    ],
    decisions: [
      "checkpoint.metadata",
      "identity.controls",
      "metrics.occupancy",
      "noise.witness",
      "reports.convergence-classification",
      "reports.divergence-status",
      "reports.ledger-rule",
      "reports.surface-discrete",
      "state.active-mask",
      "state.attached-count",
      "state.boundary-membership-order",
      "state.bounds",
      "state.cached-boundary-tuple",
      "state.cycle-phase",
      "state.domain-extents",
      "state.far-field-set",
      "state.last-attachment-delta",
      "state.neighbor-counts",
      "state.occupancy",
      "state.render-flags",
      "state.surface-policy",
      "state.wall-mask",
      "stop.reason",
      "timeline.density-transform-records",
      "timeline.reservoir-records",
    ],
    invariants: [
      "convergence.dual-or-reflecting",
      "decision.lk-fill-margin",
      "domain.no-contact",
      "fill.cfl",
      "ledger.partition",
      "relaxation.smoother-drift-bound",
      "symmetry.exact",
      "timeline.number-density-conservation",
    ],
    events: [
      "attachment-delta-log",
      "interface-step-log",
      "noise-witness",
      "relaxation-log",
      "stop",
    ],
  },
} as const;

export const PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE =
  "required cancellation-heavy diagnostic; exact clamp-path reduction and corrected-mass ledger are blocking";

export const PHASE5_LK_SWEEP_DIAGNOSTIC_RATIONALE =
  "elliptic convergence work may differ between binary64 and binary32; each lane's convergence criteria and the independent GPU trace replay are blocking";

function permittedNonblockingScalarRationale(
  fixtureId: string,
  name: unknown,
): string | null {
  if (
    fixtureId === "gg-column-dirichlet-noise-timeline-32x32x64" &&
    (name === "relaxation.shell-clamp" || name === "ledger.dirichlet-meter")
  ) {
    return PHASE5_GG_DIRECT_CLAMP_DIAGNOSTIC_RATIONALE;
  }
  if (
    fixtureId.startsWith("lk-") &&
    name === "relaxation.sweeps"
  ) {
    return PHASE5_LK_SWEEP_DIAGNOSTIC_RATIONALE;
  }
  return null;
}

function exactInventory(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  const left = [...actual].sort(lexical);
  const right = [...expected].sort(lexical);
  if (
    left.length !== right.length ||
    left.some((name, index) => name !== right[index])
  ) {
    throw new Error(`${label} inventory differs from the frozen scientific contract`);
  }
}

function fieldComparisonFailures(
  values: readonly StrictJson[],
  fixtureId: string,
): number {
  let failures = 0;
  for (const [index, value] of values.entries()) {
    const field = plainObject(value, `${fixtureId} fields[${index}]`);
    exactKeys(
      field,
      [
        "name",
        "tolerance",
        "length",
        "maxAbs",
        "rms",
        "maxRelative",
        "relativeComparedCount",
      ],
      `${fixtureId} fields[${index}]`,
    );
    const toleranceName = field.tolerance;
    if (
      typeof field.name !== "string" ||
      typeof toleranceName !== "string" ||
      !Object.hasOwn(PHASE5_FIELD_TOLERANCES, toleranceName) ||
      !Number.isSafeInteger(field.length) ||
      (field.length as number) <= 0 ||
      !Number.isSafeInteger(field.relativeComparedCount) ||
      (field.relativeComparedCount as number) < 0 ||
      typeof field.maxAbs !== "number" ||
      typeof field.rms !== "number" ||
      typeof field.maxRelative !== "number"
    ) {
      throw new Error(`${fixtureId} fields[${index}] is invalid`);
    }
    if (
      !phase5ComparisonPasses(
        {
          length: field.length as number,
          relativeComparedCount: field.relativeComparedCount as number,
          maxAbs: field.maxAbs,
          rms: field.rms,
          maxRelative: field.maxRelative,
        },
        PHASE5_FIELD_TOLERANCES[
          toleranceName as keyof typeof PHASE5_FIELD_TOLERANCES
        ],
      )
    ) {
      failures++;
    }
  }
  return failures;
}

function scalarComparisonFailures(
  values: readonly StrictJson[],
  fixtureId: string,
  expectedNames: readonly string[],
): number {
  let failures = 0;
  const names = new Set<string>();
  for (const [index, value] of values.entries()) {
    const scalar = plainObject(value, `${fixtureId} scalars[${index}]`);
    exactKeys(
      scalar,
      ["name", "cpu", "gpu", "blocking", "rationale"],
      `${fixtureId} scalars[${index}]`,
    );
    const permittedRationale = permittedNonblockingScalarRationale(
      fixtureId,
      scalar.name,
    );
    if (
      typeof scalar.name !== "string" ||
      scalar.name.length === 0 ||
      names.has(scalar.name) ||
      (scalar.cpu !== null && typeof scalar.cpu !== "number") ||
      (scalar.gpu !== null && typeof scalar.gpu !== "number") ||
      typeof scalar.blocking !== "boolean" ||
      (
        scalar.blocking
          ? scalar.rationale !== null
          : permittedRationale === null ||
            scalar.rationale !== permittedRationale
      )
    ) {
      throw new Error(`${fixtureId} scalars[${index}] is invalid`);
    }
    names.add(scalar.name);
    if (scalar.cpu === null || scalar.gpu === null) {
      if (scalar.blocking && scalar.cpu !== scalar.gpu) failures++;
      continue;
    }
    const limit =
      PHASE5_SCALAR_TOLERANCES.maxAbs +
      PHASE5_SCALAR_TOLERANCES.maxRelative * Math.abs(scalar.cpu);
    if (
      scalar.blocking &&
      Math.abs(scalar.gpu - scalar.cpu) > limit
    ) failures++;
  }
  exactInventory([...names], expectedNames, `${fixtureId} scalar`);
  return failures;
}

function exactComparisonFailures(
  values: readonly StrictJson[],
  fixtureId: string,
  label: "decisions" | "invariants",
  expectedNames: readonly string[],
): number {
  let failures = 0;
  const names = new Set<string>();
  for (const [index, value] of values.entries()) {
    const comparison = plainObject(
      value,
      `${fixtureId} ${label}[${index}]`,
    );
    if (label === "decisions") {
      exactKeys(
        comparison,
        ["name", "cpu", "gpu"],
        `${fixtureId} ${label}[${index}]`,
      );
      if (
        typeof comparison.name !== "string" ||
        comparison.name.length === 0 ||
        names.has(comparison.name)
      ) {
        throw new Error(`${fixtureId} ${label}[${index}] is invalid`);
      }
      names.add(comparison.name);
      if (canonicalJson(comparison.cpu) !== canonicalJson(comparison.gpu)) {
        failures++;
      }
    } else {
      exactKeys(
        comparison,
        [
          "name",
          "relation",
          "left",
          "right",
          "absoluteTolerance",
          "relativeTolerance",
        ],
        `${fixtureId} ${label}[${index}]`,
      );
      if (
        typeof comparison.name !== "string" ||
        comparison.name.length === 0 ||
        names.has(comparison.name) ||
        typeof comparison.relation !== "string" ||
        !["equal", "greater-or-equal", "less-or-equal", "mixed-tolerance"]
          .includes(comparison.relation) ||
        typeof comparison.absoluteTolerance !== "number" ||
        !Number.isFinite(comparison.absoluteTolerance) ||
        comparison.absoluteTolerance < 0 ||
        typeof comparison.relativeTolerance !== "number" ||
        !Number.isFinite(comparison.relativeTolerance) ||
        comparison.relativeTolerance < 0
      ) {
        throw new Error(`${fixtureId} ${label}[${index}] is invalid`);
      }
      names.add(comparison.name);
      if (comparison.relation === "equal") {
        if (canonicalJson(comparison.left) !== canonicalJson(comparison.right)) {
          failures++;
        }
      } else {
        if (
          typeof comparison.left !== "number" ||
          typeof comparison.right !== "number" ||
          !Number.isFinite(comparison.left) ||
          !Number.isFinite(comparison.right)
        ) {
          throw new Error(
            `${fixtureId} ${label}[${index}] numeric operands are invalid`,
          );
        }
        const tolerance =
          comparison.absoluteTolerance +
          comparison.relativeTolerance * Math.abs(comparison.right);
        if (
          (comparison.relation === "greater-or-equal" &&
            comparison.left + tolerance < comparison.right) ||
          (comparison.relation === "less-or-equal" &&
            comparison.left - tolerance > comparison.right) ||
          (comparison.relation === "mixed-tolerance" &&
            Math.abs(comparison.left - comparison.right) > tolerance)
        ) {
          failures++;
        }
      }
    }
  }
  exactInventory([...names], expectedNames, `${fixtureId} ${label}`);
  return failures;
}

function validateFixturePayloadGraph(
  fixtures: readonly Phase5FixtureCapture[],
  raw: Phase5LaneRawEvidence,
): void {
  const submissionSamples: StrictJson[] = [];
  const interactions: StrictJson[] = [];
  const negativeControls: StrictJson[] = [];
  let deviceLossCount = 0;
  let uncapturedErrorCount = 0;
  let hiddenRetryCount = 0;
  let fullFieldDisplayFrameCount = 0;
  let readbackTotalBytes = 0;
  const readbackRecords: StrictJson[] = [];
  let toleranceBypassCount = 0;
  for (const frozen of PHASE5_FIXTURES) {
    if (!frozen.blocking) continue;
    const fixture = fixtures.find((candidate) => candidate.id === frozen.id);
    const measurement = raw.fixtures.find((entry) => entry.id === frozen.id);
    const checkpoint = raw.checkpoints.find(
      (entry) => entry.fixtureId === frozen.id,
    );
    if (fixture === undefined || measurement === undefined || checkpoint === undefined) {
      throw new Error(`${frozen.id} payload cross-link is incomplete`);
    }
    const comparison = plainObject(
      fixture.comparison,
      `${frozen.id} comparison`,
    );
    exactKeys(
      comparison,
      [
        "schema",
        "fixtureId",
        "fields",
        "scalars",
        "decisions",
        "invariants",
        "checkpoint",
      ],
      `${frozen.id} comparison`,
    );
    if (
      comparison.schema !== PHASE5_EVIDENCE_SCHEMA.comparison ||
      comparison.fixtureId !== frozen.id ||
      canonicalJson(comparison.checkpoint) !== canonicalJson(checkpoint)
    ) {
      throw new Error(`${frozen.id} comparison differs from raw evidence`);
    }
    const fields = strictArray(comparison.fields, `${frozen.id} fields`);
    const scalars = strictArray(comparison.scalars, `${frozen.id} scalars`);
    const decisions = strictArray(
      comparison.decisions,
      `${frozen.id} decisions`,
    );
    const invariants = strictArray(
      comparison.invariants,
      `${frozen.id} invariants`,
    );
    const scienceInventory = PHASE5_SCIENCE_INVENTORY[frozen.kind];
    const fieldFailures = fieldComparisonFailures(fields, frozen.id);
    const scalarFailures = scalarComparisonFailures(
      scalars,
      frozen.id,
      scienceInventory.scalars,
    );
    const decisionFailures = exactComparisonFailures(
      decisions,
      frozen.id,
      "decisions",
      scienceInventory.decisions,
    );
    const invariantFailures = exactComparisonFailures(
      invariants,
      frozen.id,
      "invariants",
      scienceInventory.invariants,
    );
    const expectedFieldNames =
      frozen.kind === "lk"
        ? ["sigma:lkSigma", "f:lkFill"]
        : frozen.kind === "gg"
          ? ["b:ggBoundaryMass", "d:ggVapor"]
          : ["d:diffusionD"];
    const actualFieldNames = fields.map((value) => {
      const field = plainObject(value, `${frozen.id} field contract`);
      return `${String(field.name)}:${String(field.tolerance)}`;
    });
    if (
      canonicalJson(actualFieldNames) !== canonicalJson(expectedFieldNames)
    ) {
      throw new Error(`${frozen.id} comparison inventory is incomplete`);
    }
    if (
      measurement.fieldFailureCount !== fieldFailures ||
      measurement.scalarFailureCount !== scalarFailures ||
      measurement.decisionFailureCount !== decisionFailures ||
      measurement.invariantFailureCount !== invariantFailures ||
      measurement.comparisonFailureCount !==
        fieldFailures + scalarFailures + decisionFailures + invariantFailures
    ) {
      throw new Error(
        `${frozen.id} raw failure counts differ from measured comparisons: ` +
          `field ${measurement.fieldFailureCount}/${fieldFailures}, ` +
          `scalar ${measurement.scalarFailureCount}/${scalarFailures}, ` +
          `decision ${measurement.decisionFailureCount}/${decisionFailures}, ` +
          `invariant ${measurement.invariantFailureCount}/${invariantFailures}`,
      );
    }

    const timing = plainObject(fixture.timing, `${frozen.id} timing`);
    exactKeys(
      timing,
      [
        "schema",
        "fixtureId",
        "submissionSamples",
        "interactions",
        "deviceLossCount",
        "uncapturedErrorCount",
        "hiddenRetryCount",
      ],
      `${frozen.id} timing`,
    );
    if (
      timing.schema !== "phase5-timing-v1" ||
      timing.fixtureId !== frozen.id
    ) {
      throw new Error(`${frozen.id} timing identity differs`);
    }
    submissionSamples.push(
      ...strictArray(timing.submissionSamples, `${frozen.id} submissionSamples`),
    );
    interactions.push(
      ...strictArray(timing.interactions, `${frozen.id} interactions`),
    );
    for (const key of [
      "deviceLossCount",
      "uncapturedErrorCount",
      "hiddenRetryCount",
    ] as const) {
      if (!Number.isSafeInteger(timing[key]) || (timing[key] as number) < 0) {
        throw new Error(`${frozen.id} timing ${key} is invalid`);
      }
    }
    deviceLossCount += timing.deviceLossCount as number;
    uncapturedErrorCount += timing.uncapturedErrorCount as number;
    hiddenRetryCount += timing.hiddenRetryCount as number;

    const readback = plainObject(fixture.readback, `${frozen.id} readback`);
    exactKeys(
      readback,
      [
        "schema",
        "fixtureId",
        "records",
        "fullFieldDisplayFrameCount",
        "totalBytes",
      ],
      `${frozen.id} readback`,
    );
    if (
      readback.schema !== "phase5-readback-v1" ||
      readback.fixtureId !== frozen.id ||
      !Number.isSafeInteger(readback.fullFieldDisplayFrameCount) ||
      (readback.fullFieldDisplayFrameCount as number) < 0 ||
      !Number.isSafeInteger(readback.totalBytes) ||
      (readback.totalBytes as number) < 0
    ) {
      throw new Error(`${frozen.id} readback identity is invalid`);
    }
    readbackRecords.push(
      ...strictArray(readback.records, `${frozen.id} readback records`),
    );
    fullFieldDisplayFrameCount += readback.fullFieldDisplayFrameCount as number;
    readbackTotalBytes += readback.totalBytes as number;

    const events = plainObject(fixture.events, `${frozen.id} events`);
    exactKeys(
      events,
      [
        "schema",
        "fixtureId",
        "records",
        "toleranceBypassCount",
        "negativeControls",
      ],
      `${frozen.id} events`,
    );
    if (
      events.schema !== "phase5-events-v1" ||
      events.fixtureId !== frozen.id ||
      !Number.isSafeInteger(events.toleranceBypassCount) ||
      (events.toleranceBypassCount as number) < 0
    ) {
      throw new Error(`${frozen.id} events identity is invalid`);
    }
    const eventRecords = strictArray(
      events.records,
      `${frozen.id} event records`,
    );
    const eventKinds: string[] = [];
    for (const [sequence, value] of eventRecords.entries()) {
      const record = plainObject(
        value,
        `${frozen.id} event records[${sequence}]`,
      );
      exactKeys(
        record,
        ["kind", "sequence", "cpu", "gpu"],
        `${frozen.id} event records[${sequence}]`,
      );
      if (
        typeof record.kind !== "string" ||
        record.sequence !== sequence ||
        canonicalJson(record.cpu) !== canonicalJson(record.gpu)
      ) {
        throw new Error(
          `${frozen.id} event record ${sequence} is invalid or disagrees`,
        );
      }
      eventKinds.push(record.kind);
    }
    const expectedEventKinds = [
      ...scienceInventory.events,
      ...("timeline" in frozen && frozen.timeline !== null
        ? ["timeline-transition-log"]
        : []),
    ];
    exactInventory(
      eventKinds,
      expectedEventKinds,
      `${frozen.id} event record`,
    );
    toleranceBypassCount += events.toleranceBypassCount as number;
    negativeControls.push(
      ...strictArray(events.negativeControls, `${frozen.id} negative controls`),
    );
  }
  if (
    canonicalJson(submissionSamples) !== canonicalJson(raw.submissions.samples) ||
    canonicalJson(interactions) !== canonicalJson(raw.interactions) ||
    deviceLossCount !== raw.submissions.deviceLossCount ||
    uncapturedErrorCount !== raw.submissions.uncapturedErrorCount ||
    hiddenRetryCount !== raw.submissions.hiddenRetryCount
  ) {
    throw new Error("Phase 5 timing artifacts differ from raw evidence");
  }
  if (
    canonicalJson(readbackRecords) !== canonicalJson(raw.readback.records) ||
    fullFieldDisplayFrameCount !== raw.readback.fullFieldDisplayFrameCount ||
    readbackTotalBytes !== raw.readback.totalBytes
  ) {
    throw new Error("Phase 5 readback artifacts differ from raw evidence");
  }
  if (
    toleranceBypassCount !== raw.toleranceBypassCount ||
    canonicalJson(negativeControls) !== canonicalJson(raw.negativeControls)
  ) {
    throw new Error("Phase 5 event artifacts differ from raw evidence");
  }
}

function fixtureArtifactInputs(
  capture: Phase5LaneCapture,
): readonly ArtifactInput[] {
  const expectedFixtures = PHASE5_FIXTURES.filter((fixture) => fixture.blocking);
  const expectedIds = expectedFixtures.map((fixture) => fixture.id).sort(lexical);
  const actualIds = capture.fixtures.map((fixture) => fixture.id).sort(lexical);
  if (
    actualIds.length !== expectedIds.length ||
    actualIds.some((id, index) => id !== expectedIds[index])
  ) {
    throw new Error("Phase 5 fixture capture inventory differs from the freeze");
  }
  validateFixturePayloadGraph(capture.fixtures, capture.raw);
  const inputs: ArtifactInput[] = [];
  for (const frozen of expectedFixtures) {
    const fixture = capture.fixtures.find((candidate) => candidate.id === frozen.id);
    if (fixture === undefined) throw new Error(`missing fixture capture: ${frozen.id}`);
    const config = plainObject(fixture.config, `${fixture.id} config`);
    if (
      canonicalJson(config) !==
      canonicalJson({ schema: "phase5-fixture-config-v1", fixture: frozen })
    ) {
      throw new Error(`${fixture.id} config differs from the frozen fixture`);
    }
    if (
      fixture.cpuReferenceCheckpoint.byteLength === 0 ||
      fixture.gpuExportCheckpoint.byteLength === 0
    ) {
      throw new Error(`${fixture.id} checkpoints must be nonempty`);
    }
    inputs.push(
      canonicalArtifact(
        fixturePath(fixture.id, "config.json"),
        "phase5-fixture-config+json",
        config,
      ),
      {
        path: fixturePath(fixture.id, "cpu-reference.ckpt"),
        kind: frozen.kind === "lk" ? "vcc-lk-v2-checkpoint" : "vcc-gg-v1-checkpoint",
        bytes: fixture.cpuReferenceCheckpoint.slice(),
      },
      {
        path: fixturePath(fixture.id, "gpu-export.ckpt"),
        kind: frozen.kind === "lk" ? "vcc-lk-v2-checkpoint" : "vcc-gg-v1-checkpoint",
        bytes: fixture.gpuExportCheckpoint.slice(),
      },
      canonicalArtifact(
        fixturePath(fixture.id, "comparison.json"),
        "phase5-comparison+json",
        fixture.comparison,
      ),
      canonicalArtifact(
        fixturePath(fixture.id, "events.json"),
        "phase5-events+json",
        fixture.events,
      ),
      canonicalArtifact(
        fixturePath(fixture.id, "timing.json"),
        "phase5-timing+json",
        fixture.timing,
      ),
      canonicalArtifact(
        fixturePath(fixture.id, "readback.json"),
        "phase5-readback+json",
        fixture.readback,
      ),
    );
  }
  return inputs;
}

function validateIso(value: string, label: string): void {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) ||
    new Date(value).toISOString() !== value
  ) {
    throw new Error(`${label} must be a canonical UTC timestamp`);
  }
}

function validateSourceHashes(sourceHashes: readonly Phase5SourceHash[]): void {
  const paths = sourceHashes.map((entry) => entry.path);
  if (
    paths.length === 0 ||
    new Set(paths).size !== paths.length ||
    paths.some((path, index) => index > 0 && lexical(path, paths[index - 1]) <= 0)
  ) {
    throw new Error("Phase 5 source hashes must be unique and canonically ordered");
  }
  for (const entry of sourceHashes) {
    safePath(entry.path);
    if (
      !Number.isSafeInteger(entry.byteLength) ||
      entry.byteLength < 0 ||
      !SHA256.test(entry.sha256)
    ) {
      throw new Error(`invalid Phase 5 source hash: ${entry.path}`);
    }
  }
}

function makeLaneRoot(
  capture: Phase5LaneCapture,
  sourceHashes: readonly Phase5SourceHash[],
): {
  readonly manifest: Phase5LaneManifest;
  readonly report: Phase5LaneReport;
  readonly index: Phase5LaneArtifactIndex;
  readonly files: readonly ExpectedFile[];
} {
  validateIso(capture.startedAtUtc, "startedAtUtc");
  validateIso(capture.completedAtUtc, "completedAtUtc");
  if (capture.completedAtUtc < capture.startedAtUtc) {
    throw new Error("Phase 5 lane completion precedes its start");
  }
  validateSourceHashes(sourceHashes);
  if (capture.exitStatus !== 0) throw new Error("passing lane capture must have exit status 0");
  const capturedRaw = validatePhase5RawEvidence(capture.raw);
  if (capturedRaw.publicationVerified) {
    throw new Error(
      "Phase 5 browser capture cannot preclaim publisher-owned verification",
    );
  }
  const raw = validatePhase5RawEvidence({
    ...capturedRaw,
    publicationVerified: true,
  });
  const verdict = evaluatePhase5Lane(raw);
  if (!verdict.gatePass) {
    throw new Error(
      "Phase 5 lane capture is not eligible: " +
        verdict.criteria
          .filter((criterion) => !criterion.pass)
          .map((criterion) => criterion.id)
          .join(", "),
    );
  }
  const payloadInputs = [
    {
      path: "stdout.log",
      kind: "utf8-log",
      bytes: capture.stdout.slice(),
    },
    {
      path: "stderr.log",
      kind: "utf8-log",
      bytes: capture.stderr.slice(),
    },
    {
      path: "exit-status.txt",
      kind: "utf8-exit-status",
      bytes: utf8Text("0\n"),
    },
    ...fixtureArtifactInputs(capture),
  ].sort((left, right) => lexical(left.path, right.path));
  const payloadDescriptors = payloadInputs.map(descriptor);
  const adapter = {
    vendor: raw.adapter.vendor,
    architecture: raw.adapter.architecture,
    device: raw.adapter.device,
    description: raw.adapter.description,
    backend: raw.adapter.backend,
    type: raw.adapter.type,
    driver: raw.adapter.driver,
    features: [...raw.adapter.features],
    requestedFeatures: [...raw.adapter.requestedFeatures],
    limits: { ...raw.adapter.limits },
    requestedLimits: { ...raw.adapter.requestedLimits },
    deviceLimits: { ...raw.adapter.deviceLimits },
    budgets: raw.adapter.budgets.map((budget) => ({ ...budget })),
  };
  const manifest: Phase5LaneManifest = {
    schema: PHASE5_EVIDENCE_SCHEMA.laneManifest,
    lane: "windows-d3d12",
    protocol: PHASE5_PROTOCOL,
    protocolSha256: PHASE5_PROTOCOL_SHA256,
    fixtureSha256: PHASE5_FIXTURES_SHA256,
    toleranceSha256: PHASE5_TOLERANCES_SHA256,
    repository: raw.repository,
    host: raw.host,
    runtime: raw.runtime,
    adapter,
    startedAtUtc: capture.startedAtUtc,
    completedAtUtc: capture.completedAtUtc,
    sourceHashes: sourceHashes.map((entry) => ({ ...entry })),
    artifacts: payloadDescriptors,
  };
  const manifestBytes = canonicalJsonBytes(manifest);
  const manifestDescriptor = descriptor({
    path: PHASE5_LANE_MANIFEST_PATH,
    kind: "phase5-lane-manifest+json",
    bytes: manifestBytes,
  });
  const report: Phase5LaneReport = {
    schema: PHASE5_EVIDENCE_SCHEMA.laneReport,
    lane: "windows-d3d12",
    manifestSha256: manifestDescriptor.sha256,
    raw,
    criteria: verdict.criteria,
    gatePass: verdict.gatePass,
    exitCode: verdict.exitCode,
  };
  const reportBytes = canonicalJsonBytes(report);
  const reportDescriptor = descriptor({
    path: PHASE5_LANE_REPORT_PATH,
    kind: "phase5-lane-report+json",
    bytes: reportBytes,
  });
  const index: Phase5LaneArtifactIndex = {
    schema: PHASE5_EVIDENCE_SCHEMA.artifactIndex,
    publication: "complete",
    manifest: manifestDescriptor,
    report: reportDescriptor,
    artifacts: [
      manifestDescriptor,
      reportDescriptor,
      ...payloadDescriptors,
    ],
  };
  const indexBytes = canonicalJsonBytes(index);
  return {
    manifest,
    report,
    index,
    files: [
      { path: PHASE5_LANE_MANIFEST_PATH, bytes: manifestBytes },
      { path: PHASE5_LANE_REPORT_PATH, bytes: reportBytes },
      ...payloadInputs.map((input) => ({
        path: input.path,
        bytes: input.bytes,
      })),
      { path: PHASE5_LANE_INDEX_PATH, bytes: indexBytes },
    ],
  };
}

function writeExclusive(path: string, bytes: Uint8Array): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes, { flag: "wx" });
  const reopened = new Uint8Array(readFileSync(path));
  if (
    reopened.byteLength !== bytes.byteLength ||
    sha256Bytes(reopened) !== sha256Bytes(bytes)
  ) {
    throw new Error(`Phase 5 artifact changed during write: ${path}`);
  }
}

function listFiles(root: string, current = root): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    const metadata = lstatSync(absolute);
    if (metadata.isSymbolicLink()) {
      throw new Error(`Phase 5 evidence contains a symlink: ${absolute}`);
    }
    if (metadata.isDirectory()) files.push(...listFiles(root, absolute));
    else if (metadata.isFile()) {
      if (metadata.nlink !== 1) {
        throw new Error(`Phase 5 evidence contains a hard-linked file: ${absolute}`);
      }
      files.push(relative(root, absolute).split(sep).join("/"));
    } else {
      throw new Error(`Phase 5 evidence contains a non-file entry: ${absolute}`);
    }
  }
  return files.sort(lexical);
}

function verifyDescriptor(root: string, entry: Phase5ArtifactDescriptor): void {
  const absolute = join(root, entry.path);
  const stats = statSync(absolute);
  if (!stats.isFile() || stats.nlink !== 1 || stats.size !== entry.byteLength) {
    throw new Error(`Phase 5 artifact metadata mismatch: ${entry.path}`);
  }
  const bytes = new Uint8Array(readFileSync(absolute));
  if (sha256Bytes(bytes) !== entry.sha256) {
    throw new Error(`Phase 5 artifact hash mismatch: ${entry.path}`);
  }
}

function assertIndex(value: unknown): Phase5LaneArtifactIndex {
  const object = plainObject(value, "Phase 5 artifact index");
  exactKeys(
    object,
    ["schema", "publication", "manifest", "report", "artifacts"],
    "Phase 5 artifact index",
  );
  if (
    object.schema !== PHASE5_EVIDENCE_SCHEMA.artifactIndex ||
    object.publication !== "complete"
  ) {
    throw new Error("Phase 5 artifact index identity differs");
  }
  const manifest = assertDescriptor(object.manifest, "Phase 5 index manifest");
  const report = assertDescriptor(object.report, "Phase 5 index report");
  if (!Array.isArray(object.artifacts)) {
    throw new Error("Phase 5 artifact index artifacts must be an array");
  }
  const artifacts = object.artifacts.map((entry, index) =>
    assertDescriptor(entry, `Phase 5 index artifacts[${index}]`),
  );
  if (
    manifest.path !== PHASE5_LANE_MANIFEST_PATH ||
    report.path !== PHASE5_LANE_REPORT_PATH ||
    canonicalJson(artifacts[0]) !== canonicalJson(manifest) ||
    canonicalJson(artifacts[1]) !== canonicalJson(report)
  ) {
    throw new Error("Phase 5 artifact index roots differ");
  }
  const payloadPaths = artifacts.slice(2).map((entry) => entry.path);
  if (
    new Set(artifacts.map((entry) => entry.path)).size !== artifacts.length ||
    payloadPaths.some(
      (path, index) => index > 0 && lexical(path, payloadPaths[index - 1]) <= 0,
    )
  ) {
    throw new Error("Phase 5 artifact index paths are duplicated or unordered");
  }
  const contracts = expectedLaneArtifactContracts();
  if (
    artifacts.length !== contracts.length ||
    artifacts.some(
      (entry, index) =>
        entry.path !== contracts[index].path ||
        entry.kind !== contracts[index].kind,
    )
  ) {
    throw new Error(
      "Phase 5 artifact index paths or kinds differ from the frozen graph",
    );
  }
  return {
    schema: PHASE5_EVIDENCE_SCHEMA.artifactIndex,
    publication: "complete",
    manifest,
    report,
    artifacts,
  };
}

function assertManifest(value: unknown): Phase5LaneManifest {
  const object = plainObject(value, "Phase 5 lane manifest");
  exactKeys(
    object,
    [
      "schema",
      "lane",
      "protocol",
      "protocolSha256",
      "fixtureSha256",
      "toleranceSha256",
      "repository",
      "host",
      "runtime",
      "adapter",
      "startedAtUtc",
      "completedAtUtc",
      "sourceHashes",
      "artifacts",
    ],
    "Phase 5 lane manifest",
  );
  if (
    object.schema !== PHASE5_EVIDENCE_SCHEMA.laneManifest ||
    object.lane !== "windows-d3d12" ||
    object.protocol !== PHASE5_PROTOCOL ||
    object.protocolSha256 !== PHASE5_PROTOCOL_SHA256 ||
    object.fixtureSha256 !== PHASE5_FIXTURES_SHA256 ||
    object.toleranceSha256 !== PHASE5_TOLERANCES_SHA256
  ) {
    throw new Error("Phase 5 lane manifest identity differs");
  }
  const sourceHashes = object.sourceHashes;
  const artifacts = object.artifacts;
  if (!Array.isArray(sourceHashes) || !Array.isArray(artifacts)) {
    throw new Error("Phase 5 lane manifest arrays are invalid");
  }
  const parsedSourceHashes = sourceHashes.map((entry, index) => {
    const source = plainObject(entry, `sourceHashes[${index}]`);
    exactKeys(source, ["path", "byteLength", "sha256"], `sourceHashes[${index}]`);
    const path = source.path;
    const byteLength = source.byteLength;
    const sha256 = source.sha256;
    if (
      typeof path !== "string" ||
      !Number.isSafeInteger(byteLength) ||
      (byteLength as number) < 0 ||
      typeof sha256 !== "string" ||
      !SHA256.test(sha256)
    ) {
      throw new Error(`sourceHashes[${index}] is invalid`);
    }
    safePath(path);
    return { path, byteLength: byteLength as number, sha256 };
  });
  validateSourceHashes(parsedSourceHashes);
  const parsedArtifacts = artifacts.map((entry, index) =>
    assertDescriptor(entry, `manifest artifacts[${index}]`),
  );
  const repository = object.repository as unknown as Phase5LaneRawEvidence["repository"];
  const host = object.host as unknown as Phase5LaneRawEvidence["host"];
  const runtime = object.runtime as unknown as Phase5LaneRawEvidence["runtime"];
  const adapter = object.adapter as unknown as Phase5LaneManifest["adapter"];
  const startedAtUtc = object.startedAtUtc;
  const completedAtUtc = object.completedAtUtc;
  if (typeof startedAtUtc !== "string" || typeof completedAtUtc !== "string") {
    throw new Error("Phase 5 lane timestamps are invalid");
  }
  validateIso(startedAtUtc, "manifest.startedAtUtc");
  validateIso(completedAtUtc, "manifest.completedAtUtc");
  if (completedAtUtc < startedAtUtc) {
    throw new Error("Phase 5 manifest completion precedes its start");
  }
  return {
    schema: PHASE5_EVIDENCE_SCHEMA.laneManifest,
    lane: "windows-d3d12",
    protocol: PHASE5_PROTOCOL,
    protocolSha256: PHASE5_PROTOCOL_SHA256,
    fixtureSha256: PHASE5_FIXTURES_SHA256,
    toleranceSha256: PHASE5_TOLERANCES_SHA256,
    repository,
    host,
    runtime,
    adapter,
    startedAtUtc,
    completedAtUtc,
    sourceHashes: parsedSourceHashes,
    artifacts: parsedArtifacts,
  };
}

function assertReport(value: unknown): Phase5LaneReport {
  const object = plainObject(value, "Phase 5 lane report");
  exactKeys(
    object,
    ["schema", "lane", "manifestSha256", "raw", "criteria", "gatePass", "exitCode"],
    "Phase 5 lane report",
  );
  if (
    object.schema !== PHASE5_EVIDENCE_SCHEMA.laneReport ||
    object.lane !== "windows-d3d12" ||
    typeof object.manifestSha256 !== "string" ||
    !SHA256.test(object.manifestSha256) ||
    typeof object.gatePass !== "boolean" ||
    (object.exitCode !== 0 && object.exitCode !== 1) ||
    !Array.isArray(object.criteria)
  ) {
    throw new Error("Phase 5 lane report identity is invalid");
  }
  const raw = object.raw as unknown as Phase5LaneRawEvidence;
  const verdict = evaluatePhase5Lane(raw);
  if (
    canonicalJson(object.criteria) !== canonicalJson(verdict.criteria) ||
    object.gatePass !== verdict.gatePass ||
    object.exitCode !== verdict.exitCode
  ) {
    throw new Error("Phase 5 lane report disagrees with raw evidence");
  }
  return {
    schema: PHASE5_EVIDENCE_SCHEMA.laneReport,
    lane: "windows-d3d12",
    manifestSha256: object.manifestSha256,
    raw,
    criteria: verdict.criteria,
    gatePass: verdict.gatePass,
    exitCode: verdict.exitCode,
  };
}

function exactFileSet(root: string, expected: readonly string[]): void {
  const actual = listFiles(root);
  const wanted = [...expected].sort(lexical);
  if (
    actual.length !== wanted.length ||
    actual.some((path, index) => path !== wanted[index])
  ) {
    throw new Error("Phase 5 evidence file set differs from its index");
  }
}

function artifactObject(
  root: string,
  path: string,
  label: string,
): Readonly<Record<string, StrictJson>> {
  return plainObject(
    parseCanonicalJson(
      new Uint8Array(readFileSync(join(root, path))),
      label,
    ),
    label,
  );
}

function ggMetadata(decoded: ReturnType<typeof decodeCheckpoint>): StrictJson {
  const { header } = decoded;
  return strictJsonSnapshot({
    version: header.version,
    endianness: header.endianness,
    dims: header.dims,
    tick: header.tick,
    rngSeed: header.rngSeed,
    noiseEpsilon: header.noiseEpsilon,
    farField: header.farField,
    domain: header.domain,
    center: header.center,
    params: header.params,
    fields: header.fields,
  });
}

function lkControlMetadata(
  decoded: ReturnType<typeof decodeLKCheckpoint>,
): StrictJson {
  const { header } = decoded;
  return strictJsonSnapshot({
    version: header.version,
    rule: header.rule,
    endianness: header.endianness,
    dims: header.dims,
    tick: header.tick,
    rngSeed: header.rngSeed,
    noiseEpsilon: header.noiseEpsilon,
    domain: header.domain,
    center: header.center,
    tempC: header.tempC,
    sigmaInfinity: header.sigmaInfinity,
    dxUm: header.dxUm,
    pressurePa: header.pressurePa,
    paramSet: header.paramSet,
    cflFill: header.cflFill,
    relaxTol: header.relaxTol,
    divTol: header.divTol,
    relaxMaxSweeps: header.relaxMaxSweeps,
    surfacePolicy: header.version === 2 ? header.surfacePolicy : "legacy-v3",
    farField: header.farField,
    fields: header.fields,
  });
}

function serializableParameterVector(values: Float64Array): (number | null)[] {
  return Array.from(values, (value) => Number.isFinite(value) ? value : null);
}

function expectedGgCheckpointMetadata(
  fixture: Exclude<
    (typeof PHASE5_FIXTURES)[number],
    { readonly kind: "lk" | "stress" }
  >,
): StrictJson {
  const presetName =
    fixture.kind === "layout"
      ? "plate"
      : fixture.kind === "gg" && fixture.timeline !== null
        ? fixture.timeline.nextPreset
        : fixture.preset;
  const params = GG_PRESETS[presetName];
  const farField = fixture.kind === "layout" ? "reflecting" : fixture.farField;
  const tick = fixture.kind === "gg" ? Number(fixture.stop.value) : 0;
  const length = fixture.dims.nx * fixture.dims.ny * fixture.dims.nz;
  return strictJsonSnapshot({
    version: 1,
    endianness: "LE",
    dims: fixture.dims,
    tick,
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    farField,
    domain: fixture.domain,
    center: [
      fixture.dims.nx >> 1,
      fixture.dims.ny >> 1,
      fixture.dims.nz >> 1,
    ],
    params: {
      rho: params.rho,
      phi: fixture.kind === "layout" ? params.phi : fixture.phi,
      kappa: serializableParameterVector(params.kappa),
      mu: serializableParameterVector(params.mu),
      ggThreshBeta: serializableParameterVector(params.ggThreshBeta),
    },
    fields: [
      { name: "a", dtype: "u8", length },
      { name: "b", dtype: "f64", length },
      { name: "d", dtype: "f64", length },
    ],
  });
}

function expectedLkCheckpointMetadata(
  fixture: Extract<
    (typeof PHASE5_FIXTURES)[number],
    { readonly kind: "lk" }
  >,
): StrictJson {
  const length = fixture.dims.nx * fixture.dims.ny * fixture.dims.nz;
  return strictJsonSnapshot({
    version: 2,
    rule: "LibbrechtKinetics",
    endianness: "LE",
    dims: fixture.dims,
    tick: Number(fixture.stop.value),
    rngSeed: fixture.rngSeed,
    noiseEpsilon: fixture.noiseEpsilon,
    domain: fixture.domain,
    center: [
      fixture.dims.nx >> 1,
      fixture.dims.ny >> 1,
      fixture.dims.nz >> 1,
    ],
    tempC: fixture.timeline?.tempC ?? fixture.tempC,
    sigmaInfinity: fixture.timeline?.sigmaInfinity ?? fixture.sigmaInfinity,
    dxUm: fixture.dxUm,
    pressurePa: fixture.pressurePa,
    paramSet: fixture.paramSet,
    cflFill: fixture.cflFill,
    relaxTol: fixture.relaxTol,
    divTol: fixture.divTol,
    relaxMaxSweeps: fixture.relaxMaxSweeps,
    surfacePolicy: fixture.surfacePolicy,
    farField: fixture.farField,
    fields: [
      { name: "a", dtype: "u8", length },
      { name: "f", dtype: "f64", length },
      { name: "sigma", dtype: "f64", length },
    ],
  });
}

function mismatchCount(
  left: ArrayLike<number>,
  right: ArrayLike<number>,
): number {
  if (left.length !== right.length) return Math.max(left.length, right.length);
  let failures = 0;
  for (let index = 0; index < left.length; index++) {
    if (!Object.is(left[index], right[index])) failures++;
  }
  return failures;
}

function f32WideningMismatchCount(fields: readonly ArrayLike<number>[]): number {
  let failures = 0;
  for (const field of fields) {
    for (let index = 0; index < field.length; index++) {
      const value = field[index];
      if (!Number.isFinite(value) || !Object.is(Math.fround(value), value)) {
        failures++;
      }
    }
  }
  return failures;
}

function fieldEvidence(
  name: Phase5FieldComparisonEvidence["name"],
  tolerance: Phase5FieldComparisonEvidence["tolerance"],
  cpu: ArrayLike<number>,
  gpu: ArrayLike<number>,
): Phase5FieldComparisonEvidence {
  const comparison = comparePhase5Arrays(
    cpu,
    gpu,
    PHASE5_FIELD_TOLERANCES[tolerance].relativeDenominatorFloor,
  );
  return { name, tolerance, ...comparison };
}

export function derivePhase5CheckpointVerification(
  fixture: (typeof PHASE5_FIXTURES)[number],
  cpuBytes: Uint8Array,
  gpuBytes: Uint8Array,
): Phase5CheckpointVerification {
  if (!fixture.blocking) {
    throw new Error(`${fixture.id} is not a checkpoint-bearing fixture`);
  }
  if (fixture.kind === "lk") {
    const cpu = decodeLKCheckpoint(cpuBytes);
    const gpu = decodeLKCheckpoint(gpuBytes);
    for (const state of [cpu.state, gpu.state]) {
      if (
        state.dims.nx !== fixture.dims.nx ||
        state.dims.ny !== fixture.dims.ny ||
        state.dims.nz !== fixture.dims.nz
      ) {
        throw new Error(`${fixture.id} checkpoint dimensions differ`);
      }
    }
    if (cpu.header.version !== 2 || gpu.header.version !== 2) {
      throw new Error(`${fixture.id} LK checkpoint is not v2`);
    }
    if (
      !Number.isFinite(cpu.state.simTimeSeconds) ||
      cpu.state.simTimeSeconds < 0 ||
      !Number.isFinite(gpu.state.simTimeSeconds) ||
      gpu.state.simTimeSeconds < 0
    ) {
      throw new Error(`${fixture.id} LK checkpoint physical time is invalid`);
    }
    // Physical time is accumulated from binary64 CPU versus binary32 GPU interface
    // increments and is compared as a frozen scalar, not counterfeited as exact metadata.
    // Every identity/control field on both checkpoints remains exact to the fixture here.
    const cpuMetadata = lkControlMetadata(cpu);
    const gpuMetadata = lkControlMetadata(gpu);
    const expectedMetadata = expectedLkCheckpointMetadata(fixture);
    return {
      checkpoint: {
        fixtureId: fixture.id,
        codec: "lk-v2",
        cpuDecodePass: true,
        gpuDecodePass: true,
        occupancyMismatchCount: mismatchCount(cpu.state.a, gpu.state.a),
        metadataMismatchCount:
          canonicalJson(cpuMetadata) === canonicalJson(gpuMetadata) &&
          canonicalJson(cpuMetadata) === canonicalJson(expectedMetadata)
            ? 0
            : 1,
        float32RoundTripMismatchCount: f32WideningMismatchCount([
          gpu.state.f,
          gpu.state.sigma,
        ]),
        scalarType: "float32",
        endianness: "little-endian",
      },
      fields: [
        fieldEvidence("sigma", "lkSigma", cpu.state.sigma, gpu.state.sigma),
        fieldEvidence("f", "lkFill", cpu.state.f, gpu.state.f),
      ],
    };
  }
  const cpu = decodeCheckpoint(cpuBytes);
  const gpu = decodeCheckpoint(gpuBytes);
  for (const state of [cpu.state, gpu.state]) {
    if (
      state.dims.nx !== fixture.dims.nx ||
      state.dims.ny !== fixture.dims.ny ||
      state.dims.nz !== fixture.dims.nz
    ) {
      throw new Error(`${fixture.id} checkpoint dimensions differ`);
    }
  }
  const expectedMetadata = expectedGgCheckpointMetadata(fixture);
  const cpuMetadata = ggMetadata(cpu);
  const gpuMetadata = ggMetadata(gpu);
  return {
    checkpoint: {
      fixtureId: fixture.id,
      codec: "gg-v1",
      cpuDecodePass: true,
      gpuDecodePass: true,
      occupancyMismatchCount: mismatchCount(cpu.state.a, gpu.state.a),
      metadataMismatchCount:
        canonicalJson(cpuMetadata) === canonicalJson(gpuMetadata) &&
        canonicalJson(cpuMetadata) === canonicalJson(expectedMetadata)
          ? 0
          : 1,
      float32RoundTripMismatchCount: f32WideningMismatchCount([
        gpu.state.b,
        gpu.state.d,
      ]),
      scalarType: "float32",
      endianness: "little-endian",
    },
    fields:
      fixture.kind === "gg"
        ? [
            fieldEvidence(
              "b",
              "ggBoundaryMass",
              cpu.state.b,
              gpu.state.b,
            ),
            fieldEvidence("d", "ggVapor", cpu.state.d, gpu.state.d),
          ]
        : [
            fieldEvidence(
              "d",
              "diffusionD",
              cpu.state.d,
              gpu.state.d,
            ),
          ],
  };
}

function verifyFixtureGraph(
  root: string,
  report: Phase5LaneReport,
  hooks?: Phase5LaneVerificationHooks,
): void {
  const captures: Phase5FixtureCapture[] = [];
  for (const fixture of PHASE5_FIXTURES) {
    if (!fixture.blocking) continue;
    const config = artifactObject(
      root,
      fixturePath(fixture.id, "config.json"),
      `${fixture.id} config`,
    );
    if (
      canonicalJson(config) !==
      canonicalJson({ schema: "phase5-fixture-config-v1", fixture })
    ) {
      throw new Error(`${fixture.id} reopened config differs`);
    }
    const comparison = artifactObject(
      root,
      fixturePath(fixture.id, "comparison.json"),
      `${fixture.id} comparison`,
    );
    const events = artifactObject(
      root,
      fixturePath(fixture.id, "events.json"),
      `${fixture.id} events`,
    );
    const timing = artifactObject(
      root,
      fixturePath(fixture.id, "timing.json"),
      `${fixture.id} timing`,
    );
    const readback = artifactObject(
      root,
      fixturePath(fixture.id, "readback.json"),
      `${fixture.id} readback`,
    );
    const cpuBytes = new Uint8Array(
      readFileSync(join(root, fixturePath(fixture.id, "cpu-reference.ckpt"))),
    );
    const gpuBytes = new Uint8Array(
      readFileSync(join(root, fixturePath(fixture.id, "gpu-export.ckpt"))),
    );
    const derived =
      hooks?.verifyCheckpointPair !== undefined
        ? hooks.verifyCheckpointPair(fixture, cpuBytes, gpuBytes)
        : derivePhase5CheckpointVerification(fixture, cpuBytes, gpuBytes);
    const reportedCheckpoint = report.raw.checkpoints.find(
      (entry) => entry.fixtureId === fixture.id,
    );
    if (
      reportedCheckpoint === undefined ||
      canonicalJson(derived.checkpoint) !== canonicalJson(reportedCheckpoint)
    ) {
      throw new Error(
        `${fixture.id} checkpoint measurements differ from decoded bytes`,
      );
    }
    const comparisonFields = comparison.fields;
    if (
      !Array.isArray(comparisonFields) ||
      canonicalJson(derived.fields) !== canonicalJson(comparisonFields)
    ) {
      throw new Error(
        `${fixture.id} field measurements differ from decoded checkpoints`,
      );
    }
    if (
      report.raw.checkpoints.filter((entry) => entry.fixtureId === fixture.id)
        .length !== 1
    ) {
      throw new Error(`${fixture.id} checkpoint report cross-link differs`);
    }
    captures.push({
      id: fixture.id,
      config,
      cpuReferenceCheckpoint: cpuBytes,
      gpuExportCheckpoint: gpuBytes,
      comparison,
      events,
      timing,
      readback,
    });
  }
  validateFixturePayloadGraph(captures, report.raw);
}

export function verifyPhase5LaneBundle(
  directory: string,
  expectedSourceHashes?: readonly Phase5SourceHash[],
  hooks?: Phase5LaneVerificationHooks,
): VerifiedPhase5LaneBundle {
  const root = resolve(directory);
  const index = assertIndex(
    parseCanonicalJson(
      new Uint8Array(readFileSync(join(root, PHASE5_LANE_INDEX_PATH))),
      "Phase 5 artifact index",
    ),
  );
  exactFileSet(root, [
    PHASE5_LANE_INDEX_PATH,
    ...index.artifacts.map((entry) => entry.path),
  ]);
  for (const entry of index.artifacts) verifyDescriptor(root, entry);
  const manifest = assertManifest(
    parseCanonicalJson(
      new Uint8Array(readFileSync(join(root, PHASE5_LANE_MANIFEST_PATH))),
      "Phase 5 lane manifest",
    ),
  );
  const report = assertReport(
    parseCanonicalJson(
      new Uint8Array(readFileSync(join(root, PHASE5_LANE_REPORT_PATH))),
      "Phase 5 lane report",
    ),
  );
  if (
    report.manifestSha256 !== index.manifest.sha256 ||
    sha256Bytes(canonicalJsonBytes(manifest)) !== index.manifest.sha256
  ) {
    throw new Error("Phase 5 report/manifest hash cross-link differs");
  }
  if (
    canonicalJson(manifest.artifacts) !==
    canonicalJson(index.artifacts.slice(2))
  ) {
    throw new Error("Phase 5 manifest payload graph differs from the index");
  }
  if (
    canonicalJson(manifest.repository) !== canonicalJson(report.raw.repository) ||
    canonicalJson(manifest.host) !== canonicalJson(report.raw.host) ||
    canonicalJson(manifest.runtime) !== canonicalJson(report.raw.runtime) ||
    canonicalJson(manifest.adapter) !== canonicalJson(report.raw.adapter)
  ) {
    throw new Error("Phase 5 manifest provenance differs from the lane report");
  }
  if (
    expectedSourceHashes !== undefined &&
    canonicalJson(manifest.sourceHashes) !== canonicalJson(expectedSourceHashes)
  ) {
    throw new Error("Phase 5 source hashes differ from the current repository");
  }
  const exitStatus = decodeUtf8WithoutBom(
    new Uint8Array(readFileSync(join(root, "exit-status.txt"))),
    "Phase 5 exit status",
  );
  if (exitStatus !== "0\n") throw new Error("Phase 5 lane exit status is not exact");
  for (const log of ["stdout.log", "stderr.log"]) {
    decodeUtf8WithoutBom(
      new Uint8Array(readFileSync(join(root, log))),
      `Phase 5 ${log}`,
    );
  }
  verifyFixtureGraph(root, report, hooks);
  if (!report.gatePass || report.exitCode !== 0) {
    throw new Error("Phase 5 published lane report is not passing");
  }
  return { directory: root, manifest, report, index };
}

function verifyImmutableRoot(
  root: string,
  files: readonly ExpectedFile[],
): void {
  exactFileSet(root, files.map((file) => file.path));
  for (const file of files) {
    const reopened = new Uint8Array(readFileSync(join(root, file.path)));
    if (
      reopened.byteLength !== file.bytes.byteLength ||
      sha256Bytes(reopened) !== sha256Bytes(file.bytes)
    ) {
      throw new Error(`Phase 5 immutable root changed: ${file.path}`);
    }
  }
}

export function publishPhase5Lane(
  options: PublishPhase5LaneOptions,
): VerifiedPhase5LaneBundle {
  const canonicalDirectory = resolve(options.canonicalDirectory);
  if (existsSync(canonicalDirectory)) {
    throw new Error(`Phase 5 canonical lane already exists: ${canonicalDirectory}`);
  }
  if (basename(canonicalDirectory).startsWith(".")) {
    throw new Error("Phase 5 canonical lane cannot be an attempt directory");
  }
  const attemptId = options.attemptId ?? `${process.pid}-${randomUUID()}`;
  if (!/^[A-Za-z0-9-]+$/.test(attemptId)) {
    throw new Error("Phase 5 attempt id is invalid");
  }
  const root = makeLaneRoot(options.capture, options.sourceHashes);
  const parent = dirname(canonicalDirectory);
  mkdirSync(parent, { recursive: true });
  const parentIdentity = directoryIdentity(
    parent,
    "Phase 5 publication parent",
  );
  const staging = join(
    parent,
    `.${basename(canonicalDirectory)}.attempt-${attemptId}`,
  );
  if (existsSync(staging)) throw new Error(`Phase 5 staging lane exists: ${staging}`);
  mkdirSync(staging, { recursive: false });
  const ownedIdentity = directoryIdentity(staging, "Phase 5 staging lane");
  let renamed = false;
  try {
    for (const file of root.files) {
      writeExclusive(join(staging, file.path), file.bytes);
      options.hooks?.afterArtifactWrite?.(file.path, staging);
    }
    verifyImmutableRoot(staging, root.files);
    verifyPhase5LaneBundle(
      staging,
      options.sourceHashes,
      options.verificationHooks,
    );
    options.hooks?.beforeRename?.(staging);
    assertDirectoryIdentity(parent, parentIdentity, "Phase 5 publication parent");
    assertDirectoryIdentity(staging, ownedIdentity, "Phase 5 staging lane");
    verifyImmutableRoot(staging, root.files);
    verifyPhase5LaneBundle(
      staging,
      options.sourceHashes,
      options.verificationHooks,
    );
    if (existsSync(canonicalDirectory)) {
      throw new Error("Phase 5 canonical lane appeared before rename");
    }
    renameSync(staging, canonicalDirectory);
    renamed = true;
    const renamedIdentity = {
      ...ownedIdentity,
      realPath: realpathSync.native(canonicalDirectory),
    };
    assertDirectoryIdentity(
      canonicalDirectory,
      renamedIdentity,
      "Phase 5 canonical lane",
    );
    options.hooks?.afterRename?.(canonicalDirectory);
    assertDirectoryIdentity(parent, parentIdentity, "Phase 5 publication parent");
    assertDirectoryIdentity(
      canonicalDirectory,
      renamedIdentity,
      "Phase 5 canonical lane",
    );
    verifyImmutableRoot(canonicalDirectory, root.files);
    return verifyPhase5LaneBundle(
      canonicalDirectory,
      options.sourceHashes,
      options.verificationHooks,
    );
  } catch (error) {
    const owned = renamed ? canonicalDirectory : staging;
    const cleanupIdentity = renamed
      ? { ...ownedIdentity, realPath: resolve(canonicalDirectory) }
      : ownedIdentity;
    try {
      removeOwnedDirectory(owned, cleanupIdentity);
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Phase 5 publication failed and safe cleanup refused a replaced path",
      );
    }
    throw error;
  }
}
