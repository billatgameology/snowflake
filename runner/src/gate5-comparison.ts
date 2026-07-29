// Phase 5 shared comparison counting and capture artifact bytes.
//
// This module is the single production statement of the payload comparison-failure counting
// rules, the frozen per-kind science inventory, and the byte-for-byte artifact set a lane
// publication indexes. `gate5-evidence.ts` uses these bindings to validate and publish a
// capture; `gate5-negative-controls.ts` uses exactly the same bindings to score mutated
// captures, so the controls can never drift onto a private restatement of the verifier.
//
// Runtime imports here never point at either consumer (`gate5-evidence.ts` appears below as a
// type-only import), so the runtime module graph stays acyclic:
// gate5-evidence -> gate5-negative-controls -> gate5-comparison.

import {
  canonicalJson,
  canonicalJsonBytes,
  sha256Bytes,
  strictJsonSnapshot,
  type StrictJson,
} from "./gate4-evidence.ts";
import type { Phase5LaneCapture } from "./gate5-evidence.ts";
import {
  PHASE5_FIELD_TOLERANCES,
  PHASE5_FIXTURES,
  PHASE5_SCALAR_NON_APPLICABILITY,
  PHASE5_SCALAR_TOLERANCES,
} from "./phase5-protocol.ts";
import { phase5ComparisonPasses } from "./phase5-shadow.ts";

function lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function exactKeys(
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

export function plainObject(value: unknown, label: string): Readonly<Record<string, StrictJson>> {
  const snapshot = strictJsonSnapshot(value);
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error(`${label} must be an object`);
  }
  return snapshot as Readonly<Record<string, StrictJson>>;
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

export function exactInventory(
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

export function fieldComparisonFailures(
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

function registeredNonApplicability(
  fixtureId: string,
  name: unknown,
): string | null {
  const roster = (
    PHASE5_SCALAR_NON_APPLICABILITY as Readonly<
      Record<string, Readonly<Record<string, string>>>
    >
  )[fixtureId];
  if (roster === undefined || typeof name !== "string") return null;
  return Object.hasOwn(roster, name) ? roster[name] : null;
}

export function scalarComparisonFailures(
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
      ["name", "cpu", "gpu", "blocking", "rationale", "applicability"],
      `${fixtureId} scalars[${index}]`,
    );
    // A blocking scalar that was never measured used to publish null on both lanes and pass,
    // because null === null. Applicability is now declared and checked against the frozen
    // roster: "not-applicable" requires a registered reason for this exact fixture and null on
    // both lanes; "measured" requires two finite operands.
    const nonApplicability = registeredNonApplicability(fixtureId, scalar.name);
    if (scalar.applicability === "not-applicable") {
      if (nonApplicability === null) {
        throw new Error(
          `${fixtureId} scalars[${index}] claims an unregistered non-applicability`,
        );
      }
      if (scalar.cpu !== null || scalar.gpu !== null) {
        throw new Error(
          `${fixtureId} scalars[${index}] is not applicable yet carries operands`,
        );
      }
    } else if (scalar.applicability === "measured") {
      if (
        typeof scalar.cpu !== "number" ||
        !Number.isFinite(scalar.cpu) ||
        typeof scalar.gpu !== "number" ||
        !Number.isFinite(scalar.gpu)
      ) {
        throw new Error(
          `${fixtureId} scalars[${index}] is declared measured without two finite operands`,
        );
      }
    } else {
      throw new Error(`${fixtureId} scalars[${index}] declares no applicability`);
    }
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

export function exactComparisonFailures(
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

export function fixturePath(id: string, name: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`invalid fixture id: ${id}`);
  return `fixtures/${id}/${name}`;
}

export interface Phase5CaptureArtifactInput {
  readonly path: string;
  readonly kind: string;
  readonly bytes: Uint8Array;
}

/**
 * Every payload artifact a lane publication indexes, as freshly copied bytes keyed by its
 * published path and kind: the three lane logs and, per blocking fixture, the config, both
 * checkpoints, and the four payload artifacts. Publication writes exactly this set, and the
 * negative controls digest exactly this set, so the two can never disagree about which bytes
 * the sealed index covers.
 */
export function phase5CaptureArtifactInputs(
  capture: Phase5LaneCapture,
): readonly Phase5CaptureArtifactInput[] {
  const inputs: Phase5CaptureArtifactInput[] = [
    { path: "stdout.log", kind: "utf8-log", bytes: capture.stdout.slice() },
    { path: "stderr.log", kind: "utf8-log", bytes: capture.stderr.slice() },
    {
      path: "exit-status.txt",
      kind: "utf8-exit-status",
      bytes: new TextEncoder().encode(`${capture.exitStatus}\n`),
    },
  ];
  for (const frozen of PHASE5_FIXTURES) {
    if (!frozen.blocking) continue;
    const fixture = capture.fixtures.find(
      (candidate) => candidate.id === frozen.id,
    );
    if (fixture === undefined) {
      throw new Error(`the capture omits the ${frozen.id} fixture payload`);
    }
    const checkpointKind =
      frozen.kind === "lk" ? "vcc-lk-v2-checkpoint" : "vcc-gg-v1-checkpoint";
    inputs.push(
      {
        path: fixturePath(frozen.id, "config.json"),
        kind: "phase5-fixture-config+json",
        bytes: canonicalJsonBytes(fixture.config),
      },
      {
        path: fixturePath(frozen.id, "cpu-reference.ckpt"),
        kind: checkpointKind,
        bytes: fixture.cpuReferenceCheckpoint.slice(),
      },
      {
        path: fixturePath(frozen.id, "gpu-export.ckpt"),
        kind: checkpointKind,
        bytes: fixture.gpuExportCheckpoint.slice(),
      },
      {
        path: fixturePath(frozen.id, "comparison.json"),
        kind: "phase5-comparison+json",
        bytes: canonicalJsonBytes(fixture.comparison),
      },
      {
        path: fixturePath(frozen.id, "events.json"),
        kind: "phase5-events+json",
        bytes: canonicalJsonBytes(fixture.events),
      },
      {
        path: fixturePath(frozen.id, "timing.json"),
        kind: "phase5-timing+json",
        bytes: canonicalJsonBytes(fixture.timing),
      },
      {
        path: fixturePath(frozen.id, "readback.json"),
        kind: "phase5-readback+json",
        bytes: canonicalJsonBytes(fixture.readback),
      },
    );
  }
  return inputs;
}

/**
 * The digest of every artifact a lane publication indexes, keyed by its published path. This
 * is a projection of {@link phase5CaptureArtifactInputs}, the same byte set publication
 * writes.
 */
export function phase5CaptureArtifactDigests(
  capture: Phase5LaneCapture,
): ReadonlyMap<string, string> {
  const digests = new Map<string, string>();
  for (const input of phase5CaptureArtifactInputs(capture)) {
    digests.set(input.path, sha256Bytes(input.bytes));
  }
  return digests;
}
