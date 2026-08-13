/** Phase 9 S2: pure, non-3D permanent-control availability/refusal census. */

import { canonicalJson, sha256Bytes } from "./gate4-evidence.ts";
import {
  validatePhase9AdapterRegistry,
  type Phase9AdapterKind,
  type Phase9Eligibility,
  type Phase9RequestedUse,
} from "./phase9-measurement-adapters.ts";

export const PHASE9_PERMANENT_CONTROL_READINESS_PROTOCOL_ID =
  "phase9-s2-permanent-control-readiness-v1" as const;

interface Identity {
  readonly byteLength: number;
  readonly sha256: string;
}

const IDENTITIES = Object.freeze({
  shelf: Object.freeze({ byteLength: 63_975,
    sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06" }),
  registry: Object.freeze({ byteLength: 48_946,
    sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337" }),
  successor: Object.freeze({ byteLength: 36_094,
    sha256: "c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3" }),
  ggSpec: Object.freeze({ byteLength: 24_718,
    sha256: "9d7f64f92c986e036830fd4f2850a4c87a11668d01d14e5f63a666995d5c9943" }),
  lkSpec: Object.freeze({ byteLength: 56_814,
    sha256: "e245a7355aef6926a0228e69d4dedfc9c68ae311d4d04a210cace33bdf1e1900" }),
  ggSolver: Object.freeze({ byteLength: 35_382,
    sha256: "11e8b128ce0bdbe41bf564b4c92a619bc1fab06e87ac30f74f93cb67b36fdef4" }),
  lkSolver: Object.freeze({ byteLength: 91_632,
    sha256: "0719b820182d9f8edb954a6d17044f72da02084b6a7b5df58a4b9cb405976062" }),
});

const BLOCKERS = Object.freeze([
  "P9B-PARTIAL-NAKAYA-01", "P9B-PARTIAL-NAKAYA-02",
  "P9B-PARTIAL-NAKAYA-03", "P9B-PARTIAL-NAKAYA-04",
] as const);

const COMPLETE_CONTROL_SOURCES = Object.freeze([
  "56a1fe58167674455d776d63c04ddde5203c3776c168f44fd092b7cedf0b6d49",
  "5dbaf113df742de6c24e507a7961bfd50178d91481437cfd1625f6f5adddceb1",
] as const);

const EXPECTED_ADAPTER_COUNTS = Object.freeze({
  "free-particle-mass": 16,
  "gas-pressure-intervention": 10,
  "initiation-aggregate": 2,
  "interpretive-constraint": 5,
  "planar-facet": 6,
  "supported-dimension-rim": 12,
} satisfies Partial<Record<Phase9AdapterKind, number>>);

export interface Phase9PermanentControlReadinessInputs {
  readonly shelfFreezeBytes: Uint8Array;
  readonly adapterRegistryBytes: Uint8Array;
  readonly successorTargetBookBytes: Uint8Array;
  readonly ggMachinerySpecBytes: Uint8Array;
  readonly attachmentKineticsSpecBytes: Uint8Array;
  readonly ggSolverSourceBytes: Uint8Array;
  readonly lkSolverSourceBytes: Uint8Array;
}

export interface Phase9PermanentControlCensusRow {
  readonly selectionId: string;
  readonly adapterKind: Phase9AdapterKind;
  readonly purposes: readonly Phase9RequestedUse[];
}

export interface Phase9PermanentControlReadiness {
  readonly schema: "phase9-permanent-control-readiness-v1";
  readonly protocolId: typeof PHASE9_PERMANENT_CONTROL_READINESS_PROTOCOL_ID;
  readonly state: "availability-and-refusal-foundation-only";
  readonly s2SourceState: {
    readonly status: "source-blocked-pending";
    readonly blockerIds: typeof BLOCKERS;
    readonly completeControlSourceSha256: typeof COMPLETE_CONTROL_SOURCES;
  };
  readonly adapterCensus: readonly Phase9PermanentControlCensusRow[];
  readonly purposeCounts: {
    readonly adapterCompatibleWithLimitation: 51;
    readonly ineligible: 41;
    readonly sourceBlocked: 20;
  };
  readonly controls: {
    readonly GGThreshold: {
      readonly availability: "globally-refused-no-protocol-matched-score";
      readonly clock: "dimensionless-tick-no-physical-time";
      readonly reasonCodes: readonly [
        "GG_NO_PHYSICAL_CONDITION_INPUTS",
        "GG_NO_PHYSICAL_TIME_SIZE_MASS_OR_NORMAL_VELOCITY_MAPPING",
        "GG_NO_SOURCE_GEOMETRY_SUPPORT_OR_ENSEMBLE_MODEL",
        "INTERPRETIVE_ROWS_ARE_GUARDRAILS_NOT_SCORE_TARGETS",
      ];
    };
    readonly LibbrechtKinetics: {
      readonly availability: "globally-refused-no-protocol-matched-score";
      readonly clock: "physical-interface-seconds";
      readonly boundaryLimit:
        "maintained-shell-runs-require-residual-and-divergence-reflecting-is-diagnostic-only";
      readonly reasonCodes: readonly [
        "LK_NO_SOURCE_GEOMETRY_SUPPORT_SUBSTRATE_OR_ENSEMBLE_MODEL",
        "LK_FREE_PARTICLE_INITIAL_HABIT_AND_LEVITATION_UNREPRESENTED",
        "LK_PLANAR_SURFACE_FORCING_MAPPING_UNRESOLVED",
        "LK_AIR_PRESSURE_SCALING_IS_NOT_GAS_SPECIES_VENTILATION_OR_FREE_FALL",
        "INTERPRETIVE_ROWS_ARE_GUARDRAILS_NOT_SCORE_TARGETS",
      ];
    };
  };
  readonly summary: {
    readonly selectionCount: 51;
    readonly requestedPurposeCount: 112;
    readonly controlCompatibleSelectionCount: 0;
    readonly solverRunsAuthorized: 0;
    readonly quantitativeScoresProduced: 0;
    readonly physicalPromotions: 0;
    readonly validationClaimsGranted: 0;
    readonly hostReleaseAloneWouldAuthorize: false;
  };
}

type JsonRecord = Record<string, unknown>;

function assertIdentity(bytes: Uint8Array, identity: Identity, label: string): void {
  if (bytes.byteLength !== identity.byteLength || sha256Bytes(bytes) !== identity.sha256) {
    throw new Error(`${label} byte/hash identity differs`);
  }
}

function parseJson(bytes: Uint8Array, label: string): JsonRecord {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new Error(`${label} must be UTF-8 JSON`);
  }
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function same(actual: unknown, expected: unknown, label: string): void {
  if (canonicalJson(actual as never) !== canonicalJson(expected as never)) {
    throw new Error(`${label} differs`);
  }
}

function s2SourceState(bytes: Uint8Array): Phase9PermanentControlReadiness["s2SourceState"] {
  const root = parseJson(bytes, "S0B shelf freeze");
  const shelf = root.shelf;
  if (!Array.isArray(shelf)) throw new Error("S0B shelf must be an array");
  const matches = shelf.filter((value) => value !== null && !Array.isArray(value) &&
    typeof value === "object" && (value as JsonRecord).item === "S2-CONTROLS");
  if (matches.length !== 1) throw new Error("S0B must contain exactly one S2-CONTROLS row");
  const row = matches[0] as JsonRecord;
  if (row.sourceBlocked !== true || row.protocolDispositionState !== "pending" ||
      row.completeArtifactCount !== 2) {
    throw new Error("S2-CONTROLS source state differs");
  }
  same(row.sourceBlockerIds, BLOCKERS, "S2-CONTROLS blockers");
  same(row.completeArtifactSha256, COMPLETE_CONTROL_SOURCES, "S2-CONTROLS sources");
  return Object.freeze({
    status: "source-blocked-pending",
    blockerIds: BLOCKERS,
    completeControlSourceSha256: COMPLETE_CONTROL_SOURCES,
  });
}

function countStatuses(purposes: readonly Phase9RequestedUse[]): Record<Phase9Eligibility, number> {
  const counts: Record<Phase9Eligibility, number> = {
    eligible: 0, "eligible-with-limitation": 0, ineligible: 0, "source-blocked": 0,
  };
  for (const purpose of purposes) counts[purpose.status] += 1;
  return counts;
}

/** Derive the frozen 51-row S1 census and the two global permanent-control refusals. */
export function evaluatePhase9PermanentControlReadiness(
  inputs: Phase9PermanentControlReadinessInputs,
): Phase9PermanentControlReadiness {
  assertIdentity(inputs.shelfFreezeBytes, IDENTITIES.shelf, "S0B shelf freeze");
  assertIdentity(inputs.adapterRegistryBytes, IDENTITIES.registry, "S1 adapter registry");
  assertIdentity(inputs.successorTargetBookBytes, IDENTITIES.successor, "successor target book");
  assertIdentity(inputs.ggMachinerySpecBytes, IDENTITIES.ggSpec, "GGThreshold spec");
  assertIdentity(inputs.attachmentKineticsSpecBytes, IDENTITIES.lkSpec, "LK spec");
  assertIdentity(inputs.ggSolverSourceBytes, IDENTITIES.ggSolver, "GGThreshold source");
  assertIdentity(inputs.lkSolverSourceBytes, IDENTITIES.lkSolver, "LK source");

  const sourceState = s2SourceState(inputs.shelfFreezeBytes);
  const registry = validatePhase9AdapterRegistry(
    inputs.adapterRegistryBytes, inputs.successorTargetBookBytes);
  const actualAdapterCounts = Object.fromEntries(Object.entries(EXPECTED_ADAPTER_COUNTS)
    .map(([kind]) => [kind, registry.filter((row) => row.adapterKind === kind).length]));
  same(actualAdapterCounts, EXPECTED_ADAPTER_COUNTS, "51-row adapter census");

  for (const row of registry) {
    if (row.requestedUses.filter((use) => use.status === "eligible-with-limitation").length !== 1) {
      throw new Error(`${row.selectionId} must have exactly one limited primary purpose`);
    }
  }
  const purposes = registry.flatMap((row) => row.requestedUses);
  same(countStatuses(purposes), {
    eligible: 0, "eligible-with-limitation": 51, ineligible: 41, "source-blocked": 20,
  }, "S1 purpose census");
  const adapterCensus = Object.freeze(registry.map((row) => Object.freeze({
    selectionId: row.selectionId,
    adapterKind: row.adapterKind,
    purposes: row.requestedUses,
  })));

  return Object.freeze({
    schema: "phase9-permanent-control-readiness-v1",
    protocolId: PHASE9_PERMANENT_CONTROL_READINESS_PROTOCOL_ID,
    state: "availability-and-refusal-foundation-only",
    s2SourceState: sourceState,
    adapterCensus,
    purposeCounts: Object.freeze({
      adapterCompatibleWithLimitation: 51, ineligible: 41, sourceBlocked: 20,
    }),
    controls: Object.freeze({
      GGThreshold: Object.freeze({
        availability: "globally-refused-no-protocol-matched-score",
        clock: "dimensionless-tick-no-physical-time",
        reasonCodes: Object.freeze([
          "GG_NO_PHYSICAL_CONDITION_INPUTS",
          "GG_NO_PHYSICAL_TIME_SIZE_MASS_OR_NORMAL_VELOCITY_MAPPING",
          "GG_NO_SOURCE_GEOMETRY_SUPPORT_OR_ENSEMBLE_MODEL",
          "INTERPRETIVE_ROWS_ARE_GUARDRAILS_NOT_SCORE_TARGETS",
        ] as const),
      }),
      LibbrechtKinetics: Object.freeze({
        availability: "globally-refused-no-protocol-matched-score",
        clock: "physical-interface-seconds",
        boundaryLimit:
          "maintained-shell-runs-require-residual-and-divergence-reflecting-is-diagnostic-only",
        reasonCodes: Object.freeze([
          "LK_NO_SOURCE_GEOMETRY_SUPPORT_SUBSTRATE_OR_ENSEMBLE_MODEL",
          "LK_FREE_PARTICLE_INITIAL_HABIT_AND_LEVITATION_UNREPRESENTED",
          "LK_PLANAR_SURFACE_FORCING_MAPPING_UNRESOLVED",
          "LK_AIR_PRESSURE_SCALING_IS_NOT_GAS_SPECIES_VENTILATION_OR_FREE_FALL",
          "INTERPRETIVE_ROWS_ARE_GUARDRAILS_NOT_SCORE_TARGETS",
        ] as const),
      }),
    }),
    summary: Object.freeze({
      selectionCount: 51,
      requestedPurposeCount: 112,
      controlCompatibleSelectionCount: 0,
      solverRunsAuthorized: 0,
      quantitativeScoresProduced: 0,
      physicalPromotions: 0,
      validationClaimsGranted: 0,
      hostReleaseAloneWouldAuthorize: false,
    }),
  });
}
