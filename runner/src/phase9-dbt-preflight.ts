// Phase 9 D-BT launch preflight.
//
// This module is deliberately pure. A later publisher must hash the registered and observed
// bytes independently, then pass both manifests here before any source observation is scored.

export interface Phase9DbtArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

export interface Phase9DbtRosterPin {
  readonly selectionId: string;
  readonly metadataRecordId: string;
  readonly sourceUnitId: string;
  readonly runId: string;
  readonly conditions: {
    readonly tempC: number;
    readonly tempRangeC: number;
    readonly pressurePa: number;
    readonly pressureUncertainty: string;
    readonly sigmaIcePercent: number;
    readonly sigmaIceRangePercent: number;
    readonly initialRadiusUm: number;
    readonly initialRadiusRangeUm: number;
  };
  readonly rowArtifact: {
    readonly logicalRoot: string;
    readonly path: string;
    readonly byteLength: number;
    readonly rowCount: number;
    readonly sha256: string;
    readonly lastTimeS: number;
  };
  readonly scoreGrid: {
    readonly firstSecond: number;
    readonly lastSecond: number;
    readonly sampleCount: number;
  };
}

export interface Phase9DbtAdapterMappingPin {
  readonly selectionId: string;
  readonly adapterKind: "free-particle-mass";
  readonly bindingKind: "native-history";
  readonly scalarMassHistoryDevelopmentStatus: "eligible-with-limitation";
  readonly unqualifiedFreeParticleTransferStatus: "ineligible";
}

export interface Phase9DbtSourceRestriction {
  readonly artifactSha256: string;
  readonly id: string;
  readonly kind: string;
  readonly text: string;
}

export interface Phase9DbtSourceRestrictionDischarge extends Phase9DbtSourceRestriction {
  readonly status: "discharged";
  readonly localDischarge: string;
}

export interface Phase9DbtSourceOverlayShelfRow {
  readonly blockerIdentities: readonly string[];
  readonly completeArtifactCount: number;
  readonly completeArtifactSha256: readonly string[];
  readonly item: "D-BT";
  readonly protocolDispositionRequired: true;
  readonly protocolDispositionState: "pending";
  readonly protocolRestrictions: readonly Phase9DbtSourceRestriction[];
  readonly sourceBlocked: boolean;
  readonly sourceBlockerIds: readonly string[];
  readonly sourceBlockerPresent: boolean;
  readonly sourceBlockerStatuses: readonly string[];
}

export interface Phase9DbtSourceOverlayShelfPin {
  readonly schema: "phase9-source-shelf-freeze-v1";
  readonly row: Phase9DbtSourceOverlayShelfRow;
}

export interface Phase9DbtLaunchManifest {
  readonly schema: "phase9-dbt-launch-manifest-v1";
  readonly identities: {
    readonly protocol: Phase9DbtArtifactIdentity;
    readonly implementation: Phase9DbtArtifactIdentity;
    readonly test: Phase9DbtArtifactIdentity;
    readonly preflightImplementation: Phase9DbtArtifactIdentity;
    readonly preflightTest: Phase9DbtArtifactIdentity;
    readonly sourceOverlayShelfFreeze: Phase9DbtArtifactIdentity;
    readonly adapterRegistry: Phase9DbtArtifactIdentity;
  };
  readonly sourceOverlayShelf: Phase9DbtSourceOverlayShelfPin;
  readonly adapterMappings: readonly Phase9DbtAdapterMappingPin[];
  readonly primaryRoster: readonly Phase9DbtRosterPin[];
  readonly operatorPins: Phase9DbtOperatorPins;
}

export interface Phase9DbtOperatorPins {
  readonly observationDecreasePolicy: "preserve-decreases";
  readonly projectAmbientExcessHybrid: {
    readonly criticalScale: 0.000096066;
    readonly temperatureExponent: 1.9171;
    readonly drive: "ambient-excess-not-local-surface";
  };
  readonly lamb: {
    readonly exponent: 1.3153063;
    readonly massScaleCoefficient: 2.6606467;
    readonly denominatorScale: 1.1682062;
    readonly additiveScaled: 0.1123054;
  };
  readonly rescaleBounds: { readonly minimum: 0; readonly maximum: 2 };
  readonly verdict: {
    readonly family: "strict-lamb-lower";
    readonly requiredStrictPerHistoryWins: 4;
    readonly ties: "fail";
  };
}

export interface Phase9DbtPreflightProtocol {
  readonly schema: "phase9-dbt-protocol-v1";
  readonly primaryRoster: readonly Phase9DbtRosterPin[];
  readonly upstreamBindings: {
    readonly sourceOverlay: {
      readonly shelfFreezePath: string;
      readonly identity: Phase9DbtArtifactIdentity;
      readonly shelfFreezeSchema: "phase9-source-shelf-freeze-v1";
      readonly shelfItem: "D-BT";
      readonly requiredSourceBlocked: false;
      readonly restrictionDischarges: Readonly<
        Record<string, Phase9DbtSourceRestrictionDischarge>
      >;
    };
    readonly measurementAdapters: {
      readonly identity: Phase9DbtArtifactIdentity;
      readonly requiredMappings: readonly Phase9DbtAdapterMappingPin[];
    };
  };
  readonly launchPreflight: {
    readonly requiredIdentityPaths: {
      readonly protocol: string;
      readonly implementation: string;
      readonly test: string;
      readonly preflightImplementation: string;
      readonly preflightTest: string;
    };
    readonly requiredOperatorPins: Phase9DbtOperatorPins;
  };
}

export const PHASE9_DBT_PREFLIGHT_MUTATIONS = Object.freeze([
  "source-byte-change",
  "roster-shift",
  "condition-shift",
  "grid-shift-or-t500",
  "source-overlay-blocked",
  "source-overlay-blocker-present",
  "source-overlay-blocker-id-injected",
  "source-overlay-restriction-change",
  "local-discharge-missing",
  "adapter-registry-byte-change",
  "adapter-mapping-change",
  "protocol-code-or-test-byte-change",
  "monotonic-observation-filter",
  "coefficient-change",
  "verdict-change",
] as const);

export interface Phase9DbtPreflightPass {
  readonly pass: true;
  readonly rosterCount: 6;
  readonly pinnedSelectionIds: readonly string[];
  readonly registeredNegativeControlNames: typeof PHASE9_DBT_PREFLIGHT_MUTATIONS;
}

function fail(message: string): never {
  throw new Error(`D-BT preflight refused: ${message}`);
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) =>
    `${JSON.stringify(key)}:${canonical(record[key])}`,
  ).join(",")}}`;
}

function requireSame(actual: unknown, expected: unknown, label: string): void {
  if (canonical(actual) !== canonical(expected)) fail(`${label} differs from its frozen pin`);
}

function validateIdentity(identity: Phase9DbtArtifactIdentity, expectedPath: string): void {
  if (identity.path !== expectedPath) fail(`identity path must be ${expectedPath}`);
  if (!Number.isSafeInteger(identity.byteLength) || identity.byteLength <= 0) {
    fail(`${expectedPath} byte length must be a positive safe integer`);
  }
  if (!/^[0-9a-f]{64}$/.test(identity.sha256)) fail(`${expectedPath} SHA-256 is malformed`);
}

function validateRoster(roster: readonly Phase9DbtRosterPin[]): void {
  if (roster.length !== 6) fail("primary roster must contain exactly six histories");
  const selectionIds = new Set<string>();
  const runIds = new Set<string>();
  for (const entry of roster) {
    if (
      !entry.selectionId ||
      !entry.metadataRecordId ||
      !entry.sourceUnitId ||
      !entry.runId ||
      selectionIds.has(entry.selectionId) ||
      runIds.has(entry.runId)
    ) {
      fail("roster IDs must be nonempty and unique");
    }
    selectionIds.add(entry.selectionId);
    runIds.add(entry.runId);
    const tempK = entry.conditions.tempC + 273.15;
    if (!Number.isFinite(tempK) || tempK < 205 || tempK > 240) {
      fail(`${entry.runId} must satisfy 205 <= T <= 240 K`);
    }
    if (
      !(entry.conditions.tempRangeC >= 0) ||
      !(entry.conditions.pressurePa > 0) ||
      !(entry.conditions.sigmaIcePercent >= 0) ||
      !(entry.conditions.sigmaIceRangePercent >= 0) ||
      !(entry.conditions.initialRadiusUm > 0) ||
      !(entry.conditions.initialRadiusRangeUm >= 0)
    ) {
      fail(`${entry.runId} has an invalid registered condition`);
    }
    if (
      !Number.isSafeInteger(entry.rowArtifact.byteLength) ||
      entry.rowArtifact.byteLength <= 0 ||
      !Number.isSafeInteger(entry.rowArtifact.rowCount) ||
      entry.rowArtifact.rowCount <= 0 ||
      !(entry.rowArtifact.lastTimeS >= 0) ||
      entry.rowArtifact.logicalRoot.length === 0 ||
      entry.rowArtifact.path.length === 0 ||
      !/^[0-9a-f]{64}$/.test(entry.rowArtifact.sha256)
    ) {
      fail(`${entry.runId} has an invalid row artifact identity`);
    }
    const expectedLastSecond = Math.min(499, Math.floor(entry.rowArtifact.lastTimeS));
    if (
      entry.scoreGrid.firstSecond !== 0 ||
      entry.scoreGrid.lastSecond !== expectedLastSecond ||
      entry.scoreGrid.lastSecond >= 500 ||
      entry.scoreGrid.sampleCount !== expectedLastSecond + 1
    ) {
      fail(`${entry.runId} grid must be the structured integer domain 0 <= t < 500`);
    }
  }
}

function validateAdapterMappings(
  mappings: readonly Phase9DbtAdapterMappingPin[],
  roster: readonly Phase9DbtRosterPin[],
): void {
  if (mappings.length !== 6) fail("adapter binding must contain exactly six mappings");
  const bySelectionId = new Map(mappings.map((mapping) => [mapping.selectionId, mapping]));
  if (bySelectionId.size !== 6) fail("adapter mapping selection IDs must be unique");
  for (const entry of roster) {
    const mapping = bySelectionId.get(entry.selectionId);
    if (
      mapping?.adapterKind !== "free-particle-mass" ||
      mapping.bindingKind !== "native-history" ||
      mapping.scalarMassHistoryDevelopmentStatus !== "eligible-with-limitation" ||
      mapping.unqualifiedFreeParticleTransferStatus !== "ineligible"
    ) {
      fail(`${entry.selectionId} lacks the frozen S1 free-particle mapping`);
    }
  }
}

function validateSourceOverlayShelf(
  shelf: Phase9DbtSourceOverlayShelfPin,
  binding: Phase9DbtPreflightProtocol["upstreamBindings"]["sourceOverlay"],
): void {
  if (shelf.schema !== binding.shelfFreezeSchema) {
    fail("S0B shelf-freeze schema differs from its protocol binding");
  }
  const row = shelf.row;
  if (row.item !== binding.shelfItem) fail("S0B shelf row is not D-BT");
  if (row.sourceBlocked !== binding.requiredSourceBlocked) {
    fail("S0B reports D-BT source-blocked");
  }
  if (
    row.sourceBlockerPresent ||
    row.sourceBlockerIds.length !== 0 ||
    row.blockerIdentities.length !== 0 ||
    row.sourceBlockerStatuses.length !== 0
  ) {
    fail("S0B D-BT row carries an unresolved source-blocker witness");
  }
  if (!row.protocolDispositionRequired || row.protocolDispositionState !== "pending") {
    fail("S0B D-BT protocol disposition contract differs");
  }

  const dischargeEntries = Object.entries(binding.restrictionDischarges);
  if (dischargeEntries.length !== 9) {
    fail("D-BT protocol must carry exactly nine S0B restriction discharges");
  }
  const expectedRestrictions: Phase9DbtSourceRestriction[] = [];
  for (const [key, discharge] of dischargeEntries) {
    if (key !== discharge.id) fail(`S0B restriction discharge key ${key} differs from its ID`);
    if (discharge.status !== "discharged" || discharge.localDischarge.trim().length === 0) {
      fail(`S0B restriction ${key} lacks a local discharge`);
    }
    expectedRestrictions.push({
      artifactSha256: discharge.artifactSha256,
      id: discharge.id,
      kind: discharge.kind,
      text: discharge.text,
    });
  }
  const sorted = (values: readonly Phase9DbtSourceRestriction[]) =>
    [...values].sort((left, right) => left.id.localeCompare(right.id));
  if (new Set(row.protocolRestrictions.map((restriction) => restriction.id)).size !== 9) {
    fail("S0B D-BT restriction IDs must be nine unique values");
  }
  requireSame(
    sorted(row.protocolRestrictions),
    sorted(expectedRestrictions),
    "S0B D-BT structured restrictions and local discharges",
  );
  const completeArtifacts = new Set(row.completeArtifactSha256);
  if (
    row.completeArtifactCount !== completeArtifacts.size ||
    row.protocolRestrictions.some((restriction) => !completeArtifacts.has(restriction.artifactSha256))
  ) {
    fail("S0B D-BT restriction artifact identity is outside its complete-artifact set");
  }
}

/**
 * Validate a pre-score registration against the protocol, then independently observed identities
 * against that registration. The caller, not this pure function, owns byte hashing and publication.
 */
export function phase9DbtRunLaunchPreflight(
  protocol: Phase9DbtPreflightProtocol,
  registration: Phase9DbtLaunchManifest,
  observed: Phase9DbtLaunchManifest,
): Phase9DbtPreflightPass {
  if (protocol.schema !== "phase9-dbt-protocol-v1") fail("protocol schema is not recognized");
  if (
    registration.schema !== "phase9-dbt-launch-manifest-v1" ||
    observed.schema !== "phase9-dbt-launch-manifest-v1"
  ) {
    fail("launch manifest schema is not recognized");
  }
  validateRoster(protocol.primaryRoster);
  requireSame(registration.primaryRoster, protocol.primaryRoster, "registered primary roster");
  validateRoster(registration.primaryRoster);

  validateIdentity(
    registration.identities.protocol,
    protocol.launchPreflight.requiredIdentityPaths.protocol,
  );
  validateIdentity(
    registration.identities.implementation,
    protocol.launchPreflight.requiredIdentityPaths.implementation,
  );
  validateIdentity(registration.identities.test, protocol.launchPreflight.requiredIdentityPaths.test);
  validateIdentity(
    registration.identities.preflightImplementation,
    protocol.launchPreflight.requiredIdentityPaths.preflightImplementation,
  );
  validateIdentity(
    registration.identities.preflightTest,
    protocol.launchPreflight.requiredIdentityPaths.preflightTest,
  );
  validateIdentity(
    registration.identities.sourceOverlayShelfFreeze,
    protocol.upstreamBindings.sourceOverlay.shelfFreezePath,
  );
  requireSame(
    registration.identities.sourceOverlayShelfFreeze,
    protocol.upstreamBindings.sourceOverlay.identity,
    "final S0B shelf-freeze identity",
  );
  validateIdentity(
    registration.identities.adapterRegistry,
    protocol.upstreamBindings.measurementAdapters.identity.path,
  );
  requireSame(
    registration.identities.adapterRegistry,
    protocol.upstreamBindings.measurementAdapters.identity,
    "S1 adapter registry identity",
  );
  validateSourceOverlayShelf(
    registration.sourceOverlayShelf,
    protocol.upstreamBindings.sourceOverlay,
  );
  requireSame(
    registration.adapterMappings,
    protocol.upstreamBindings.measurementAdapters.requiredMappings,
    "registered S1 mappings",
  );
  validateAdapterMappings(registration.adapterMappings, registration.primaryRoster);
  requireSame(
    registration.operatorPins,
    protocol.launchPreflight.requiredOperatorPins,
    "registered observation, coefficient, and verdict operators",
  );

  requireSame(observed, registration, "independently observed launch manifest");
  return {
    pass: true,
    rosterCount: 6,
    pinnedSelectionIds: registration.primaryRoster.map((entry) => entry.selectionId),
    registeredNegativeControlNames: PHASE9_DBT_PREFLIGHT_MUTATIONS,
  };
}
