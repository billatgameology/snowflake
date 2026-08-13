import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_HOLLOWING_CLAIM_BOUNDARY,
  PHASE9_HOLLOWING_PROTOCOL_ID,
  PHASE9_HP26_RIM_FIXTURES,
  PHASE9_MANUFACTURED_WIDTH_FIXTURE,
  PHASE9_NORMALIZED_WIDTH_ROSTER,
  PHASE9_OBSERVED_SURFACE_FEATURES,
  phase9HollowingEligibility,
  phase9Hp26RimFeatureReplay,
  phase9ManufacturedWidthEstimate,
  phase9NormalizedWidthLaw,
  phase9ObservedSurfaceFeatureComparison,
  type Phase9HollowingPurpose,
  type Phase9Hp26RimReplayInput,
  type Phase9ManufacturedWidthInput,
  type Phase9NormalizedWidthLawInput,
  type Phase9ObservedFeatureComparisonInput,
} from "../src/phase9-hollowing-rivals.ts";

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface CanonicalRecordIdentity {
  readonly canonicalJsonByteLength: number;
  readonly canonicalJsonSha256: string;
}

interface Protocol extends Record<string, unknown> {
  readonly schema: string;
  readonly protocolId: string;
  readonly state: Record<string, unknown>;
  readonly implementationArtifacts: Record<string, ArtifactIdentity>;
  readonly authorityBindings: {
    readonly s0b: {
      readonly shelfFreeze: ArtifactIdentity;
      readonly sourceOverlay: ArtifactIdentity;
      readonly blockers: ArtifactIdentity;
      readonly exactShelfRecords: readonly (CanonicalRecordIdentity & {
        readonly item: string;
        readonly completeArtifactCount: number;
        readonly sourceBlockerIds: readonly string[];
        readonly protocolDispositionState: string;
        readonly localHandling: string;
      })[];
      readonly exactSourceOverlayRecords: readonly (CanonicalRecordIdentity & {
        readonly artifactSha256: string;
      })[];
      readonly exactHp26Blocker: Record<string, unknown>;
    };
    readonly knowledge: {
      readonly calculations: ArtifactIdentity;
      readonly hypotheses: ArtifactIdentity;
      readonly sourceRegister: ArtifactIdentity;
      readonly exactSubrecords: readonly (CanonicalRecordIdentity & {
        readonly kind: "calculation" | "hypothesis" | "source";
        readonly id: string;
      })[];
      readonly mHInheritance: Record<string, unknown>;
    };
    readonly s1AndSelectedHistories: {
      readonly adapterRegistry: ArtifactIdentity;
      readonly successorTargetBook: ArtifactIdentity;
      readonly nativeHistoryMetadata: ArtifactIdentity;
      readonly terminalRecords: ArtifactIdentity;
      readonly exactAdapterRows: readonly (CanonicalRecordIdentity & {
        readonly selectionId: string;
      })[];
      readonly exactTargetRows: readonly (CanonicalRecordIdentity & {
        readonly selectionId: string;
      })[];
      readonly selectedRimHistories: readonly Record<string, unknown>[];
      readonly absoluteForcingRestriction: Record<string, string>;
    };
  };
  readonly pdfInspection: {
    readonly method: string;
    readonly records: readonly Record<string, unknown>[];
    readonly limit: string;
  };
  readonly rivals: Record<string, Record<string, unknown>>;
  readonly manufacturedWidthFixture: Record<string, unknown>;
  readonly allowedPurposes: readonly string[];
  readonly refusedPurposes: Record<string, string>;
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
  };
}

interface ShelfRecord {
  readonly item: string;
  readonly completeArtifactCount: number;
  readonly sourceBlockerIds: readonly string[];
  readonly protocolDispositionState: string;
}

interface OverlayRecord {
  readonly sha256: string;
}

interface IdRecord {
  readonly hypothesisId?: string;
  readonly sourceId?: string;
  readonly selectionId?: string;
  readonly id?: string;
}

const ROOT = resolve(import.meta.dirname, "../..");
const PROTOCOL_PATH = "research/phase9-hollowing-rivals-protocol-v1.json";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8")) as T;
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(resolve(ROOT, path), "utf8").trimEnd().split("\n")
    .map((line) => JSON.parse(line) as T);
}

function protocol(): Protocol {
  return readJson<Protocol>(PROTOCOL_PATH);
}

function sha256(bytes: string | Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileIdentity(identity: ArtifactIdentity): void {
  const bytes = readFileSync(resolve(ROOT, identity.path));
  expect(bytes.byteLength, identity.path).toBe(identity.byteLength);
  expect(sha256(bytes), identity.path).toBe(identity.sha256);
}

function expectCanonicalIdentity(value: unknown, identity: CanonicalRecordIdentity): void {
  const encoded = JSON.stringify(value);
  expect(Buffer.byteLength(encoded)).toBe(identity.canonicalJsonByteLength);
  expect(sha256(encoded)).toBe(identity.canonicalJsonSha256);
}

function widthInput(widthOverW0: number): Phase9NormalizedWidthLawInput {
  return {
    purpose: "registered-normalized-width-law-shape",
    widthOverW0,
    physicalWidthM: null,
    w0M: null,
  };
}

function manufacturedInput(): Phase9ManufacturedWidthInput {
  return {
    purpose: "registered-manufactured-half-maximum-width",
    provenance: "P4-symmetric-piecewise-linear-half-maximum-fixture",
    coordinateUnit: "dimensionless-manufactured-coordinate",
    coordinates: [...PHASE9_MANUFACTURED_WIDTH_FIXTURE.coordinates],
    profile: [...PHASE9_MANUFACTURED_WIDTH_FIXTURE.profile],
    thresholdFraction: 0.5,
    physicalWidthMapping: "absent",
  };
}

function rimInput(selectionId: keyof typeof PHASE9_HP26_RIM_FIXTURES): Phase9Hp26RimReplayInput {
  return {
    purpose: "registered-source-labelled-rim-feature-replay",
    selectionId,
    support: "substrate",
    temperatureC: -50,
    forcingSemantics: "source-labelled-categorical-only",
    absoluteForcingConversion: false,
  };
}

function observedInput(): Phase9ObservedFeatureComparisonInput {
  return {
    purpose: "registered-observed-surface-feature-comparison",
    sourceRoster: ["nelson-swanson-2019", "voigtlander-et-al-2018", "magee-et-al-2014"],
    transportMatching: "unavailable",
    numericCodebook: "unavailable",
  };
}

describe("Phase 9 S9 hollowing-rivals authority bindings", () => {
  it("pins the new implementation and diagnostic-only state", () => {
    const frozen = protocol();
    expect(frozen.schema).toBe("phase9-hollowing-rivals-protocol-v1");
    expect(frozen.protocolId).toBe(PHASE9_HOLLOWING_PROTOCOL_ID);
    expect(frozen.state).toEqual({
      role: "maximum-honest-prescore-foundation",
      sourceObservationsReadByRunner: 0,
      sourceDataScoresProduced: 0,
      mechanismRankingAuthorized: false,
      morphologyInferenceAuthorized: false,
      causalInferenceAuthorized: false,
      physicalPromotionAuthorized: false,
      validationClaimAuthorized: false,
      threeDimensionalCampaignAuthorized: false,
    });
    Object.values(frozen.implementationArtifacts).forEach(fileIdentity);
    expect(PHASE9_HOLLOWING_CLAIM_BOUNDARY).toEqual({
      phase9Role: "development-only-prescore-foundation",
      sourceReplayAvailable: true,
      sourceDataScoreAvailable: false,
      mechanismRankingAvailable: false,
      morphologyInferenceAvailable: false,
      causalInferenceAvailable: false,
      physicalPromotionAvailable: false,
      validationClaimAvailable: false,
      threeDimensionalCampaignAvailable: false,
    });
  });

  it("exact-binds S0B shelf records, overlay rows, restrictions, and the HP26 blocker", () => {
    const binding = protocol().authorityBindings.s0b;
    [binding.shelfFreeze, binding.sourceOverlay, binding.blockers].forEach(fileIdentity);
    const shelves = readJson<{ readonly shelf: readonly ShelfRecord[] }>(binding.shelfFreeze.path)
      .shelf;
    for (const expected of binding.exactShelfRecords) {
      const row = shelves.find((candidate) => candidate.item === expected.item);
      expect(row).toBeDefined();
      expectCanonicalIdentity(row, expected);
      expect(row).toMatchObject({
        completeArtifactCount: expected.completeArtifactCount,
        sourceBlockerIds: expected.sourceBlockerIds,
        protocolDispositionState: expected.protocolDispositionState,
      });
      expect(expected.localHandling.length).toBeGreaterThan(80);
    }
    const overlays = readJsonl<OverlayRecord>(binding.sourceOverlay.path);
    for (const expected of binding.exactSourceOverlayRecords) {
      const row = overlays.find((candidate) => candidate.sha256 === expected.artifactSha256);
      expect(row).toBeDefined();
      expectCanonicalIdentity(row, expected);
    }
    const blockers = readJsonl<Record<string, unknown>>(binding.blockers.path);
    expect(blockers.find((row) => row.blockerId === "P9B-MISSING-HP26")).toEqual(
      binding.exactHp26Blocker,
    );
  });

  it("exact-binds knowledge, S1, selected histories, and the M-H knowledge-only boundary", () => {
    const frozen = protocol().authorityBindings;
    [
      frozen.knowledge.calculations,
      frozen.knowledge.hypotheses,
      frozen.knowledge.sourceRegister,
      frozen.s1AndSelectedHistories.adapterRegistry,
      frozen.s1AndSelectedHistories.successorTargetBook,
      frozen.s1AndSelectedHistories.nativeHistoryMetadata,
      frozen.s1AndSelectedHistories.terminalRecords,
    ].forEach(fileIdentity);

    const calculations = readJson<Record<string, unknown>>(frozen.knowledge.calculations.path);
    const hypotheses = readJsonl<IdRecord>(frozen.knowledge.hypotheses.path);
    const sources = readJsonl<IdRecord>(frozen.knowledge.sourceRegister.path);
    for (const expected of frozen.knowledge.exactSubrecords) {
      const row = expected.kind === "calculation"
        ? calculations[expected.id]
        : expected.kind === "hypothesis"
        ? hypotheses.find((candidate) => candidate.hypothesisId === expected.id)
        : sources.find((candidate) => candidate.sourceId === expected.id);
      expect(row).toBeDefined();
      expectCanonicalIdentity(row, expected);
    }
    expect(frozen.knowledge.mHInheritance).toEqual({
      implementationOrProtocolAvailable: false,
      inheritedOnlyAsKnowledge: ["P9H-FORCING-PATH", "P9H-MEMORY-STATE"],
      handling:
        "No hidden memory state is invented. The selected HP26 event remains a categorical observed change-point, and an event response does not identify memory.",
    });

    const adapters = readJsonl<IdRecord>(frozen.s1AndSelectedHistories.adapterRegistry.path);
    const targets = readJsonl<IdRecord>(frozen.s1AndSelectedHistories.successorTargetBook.path);
    for (const expected of frozen.s1AndSelectedHistories.exactAdapterRows) {
      const row = adapters.find((candidate) => candidate.selectionId === expected.selectionId);
      expectCanonicalIdentity(row, expected);
    }
    for (const expected of frozen.s1AndSelectedHistories.exactTargetRows) {
      const row = targets.find((candidate) => candidate.selectionId === expected.selectionId);
      expectCanonicalIdentity(row, expected);
    }
    expect(frozen.s1AndSelectedHistories.absoluteForcingRestriction).toEqual({
      allowed: "dimension-versus-time and source-labelled change-point development analysis",
      forbidden:
        "conversion of 48 or 20 percent to solver sigmaInfinity, inferred supersaturation uncertainty, or absolute forcing-response score",
      upgrade: "acquire and inspect the first-report Methods before lifting this restriction",
    });
  });

  it("records complete PDF inspection but grants it no numeric or causal authority", () => {
    const inspection = protocol().pdfInspection;
    expect(inspection.method).toBe(
      "PDF skill: Poppler page rendering followed by complete visual contact-sheet inspection; text extraction used only as a locator aid",
    );
    expect(inspection.records.map((row) => row.pagesRenderedAndInspected ?? row.pdfStatus)).toEqual([
      "1-36 of 36",
      "1-16 of 16",
      "1-15 of 15",
      "absent; S0B and knowledge records bind the final DOI but only the companion archive is present",
    ]);
    expect(inspection.limit).toContain("no numeric coordinate extraction");
  });
});

describe("Phase 9 S9 normalized and manufactured M-W diagnostics", () => {
  it("independently reproduces the normalized width-law roster", () => {
    const expected = [
      0.09516258196404043,
      0.3934693402873666,
      0.6321205588285577,
      0.8646647167633873,
      0.9932620530009145,
    ];
    PHASE9_NORMALIZED_WIDTH_ROSTER.forEach((widthOverW0, index) => {
      const result = phase9NormalizedWidthLaw(widthInput(widthOverW0));
      expect(result.barrierFractionOfBroadFacet).toBe(expected[index]);
      expect(result.barrierReductionFraction).toBe(1 - expected[index]);
      expect(result).toMatchObject({
        status: "normalized-width-law-diagnostic-only",
        physicalWidthMappingAvailable: false,
        newerPrincetonEditionCompared: false,
        sourceDataScoreProduced: false,
        physicalPromotionEligible: false,
        grantsValidationClaim: false,
      });
    });
  });

  it("refuses physical operands, out-of-domain values, wrong purpose, and extra fields", () => {
    expect(() => phase9NormalizedWidthLaw({ ...widthInput(1), physicalWidthM: 1e-6 } as
      unknown as Phase9NormalizedWidthLawInput)).toThrow(/physical w/u);
    expect(() => phase9NormalizedWidthLaw(widthInput(0))).toThrow(/domain/u);
    expect(() => phase9NormalizedWidthLaw(widthInput(Number.NaN))).toThrow(/finite/u);
    expect(() => phase9NormalizedWidthLaw({ ...widthInput(1), purpose: "physical-width" } as
      unknown as Phase9NormalizedWidthLawInput)).toThrow(/purpose/u);
    expect(() => phase9NormalizedWidthLaw({ ...widthInput(1), latticeWidthCells: 4 } as
      unknown as Phase9NormalizedWidthLawInput)).toThrow(/fields/u);
  });

  it("recovers the exact manufactured half-maximum width and rejects fixture mutations", () => {
    expect(phase9ManufacturedWidthEstimate(manufacturedInput())).toEqual({
      status: "manufactured-width-estimator-diagnostic-only",
      leftCrossing: -0.5,
      rightCrossing: 0.5,
      width: 1,
      exactWidth: 1,
      absoluteError: 0,
      manufacturedIdentitySatisfied: true,
      physicalWidthMappingAvailable: false,
      sourceDataScoreProduced: false,
      physicalPromotionEligible: false,
      grantsValidationClaim: false,
    });
    const mutatedProfile = manufacturedInput();
    expect(() => phase9ManufacturedWidthEstimate({
      ...mutatedProfile,
      profile: mutatedProfile.profile.map((value, index) => index === 2 ? value + 0.01 : value),
    })).toThrow(/exact registered/u);
    expect(() => phase9ManufacturedWidthEstimate({
      ...manufacturedInput(),
      physicalWidthMapping: "metres",
    } as unknown as Phase9ManufacturedWidthInput)).toThrow(/exact registered/u);
    const sparseCoordinates = manufacturedInput();
    delete (sparseCoordinates.coordinates as number[])[0];
    expect(() => phase9ManufacturedWidthEstimate(sparseCoordinates)).toThrow(/exact registered/u);
  });
});

describe("Phase 9 S9 rim and observed-state feature comparisons", () => {
  it("independently re-derives both selected HP26 endpoint and event features", () => {
    const first = phase9Hp26RimFeatureReplay(rimInput("P8B-P0-10C734F0C6C31B5904B10BE7"));
    expect(first.aFactor).toBe(37.64 / 11.14);
    expect(first.cFactor).toBe(221.01 / 34.91);
    expect(first.rimFactor).toBe(6.71 / 6.75);
    expect(first.rimToAInitial).toBe(6.75 / 11.14);
    expect(first.rimToAFinal).toBe(6.71 / 37.64);
    expect(first.event).toBeNull();

    const second = phase9Hp26RimFeatureReplay(rimInput("P8B-P0-2CF2C2C5B3A6900FC3F9CDDA"));
    expect(second.aFactor).toBe(54.71 / 14.13);
    expect(second.cFactor).toBe(194.95 / 19.31);
    expect(second.rimFactor).toBe(31.65 / 5.53);
    expect(second.event).toEqual({
      eventTimeS: 13800,
      observationAtEvent: false,
      beforeToFirstAfterRimChangeFraction: (7.87 - 6.37) / 6.37,
      beforeToSecondAfterRimChangeFraction: (13.81 - 6.37) / 6.37,
    });
    for (const result of [first, second]) {
      expect(result).toMatchObject({
        status: "same-lineage-rim-feature-replay-only",
        absoluteForcingAvailable: false,
        mechanismRankingAvailable: false,
        causalInferenceAvailable: false,
        sourceDataScoreProduced: false,
        physicalPromotionEligible: false,
        grantsValidationClaim: false,
      });
    }
  });

  it("refuses altered support, temperature, forcing conversion, unknown history, and extra fields", () => {
    const base = rimInput("P8B-P0-2CF2C2C5B3A6900FC3F9CDDA");
    expect(() => phase9Hp26RimFeatureReplay({ ...base, support: "free-fall" } as
      unknown as Phase9Hp26RimReplayInput)).toThrow(/preserve/u);
    expect(() => phase9Hp26RimFeatureReplay({ ...base, temperatureC: -15 } as
      unknown as Phase9Hp26RimReplayInput)).toThrow(/preserve/u);
    expect(() => phase9Hp26RimFeatureReplay({ ...base, absoluteForcingConversion: true } as
      unknown as Phase9Hp26RimReplayInput)).toThrow(/preserve/u);
    expect(() => phase9Hp26RimFeatureReplay({ ...base, selectionId: "invented" } as
      unknown as Phase9Hp26RimReplayInput)).toThrow(/unrecognized/u);
    expect(() => phase9Hp26RimFeatureReplay({ ...base, sigmaInfinity: 0.2 } as
      unknown as Phase9Hp26RimReplayInput)).toThrow(/fields/u);
  });

  it("returns all three categorical M-SR records without scoring or ranking", () => {
    const result = phase9ObservedSurfaceFeatureComparison(observedInput());
    expect(result.records).toEqual(Object.values(PHASE9_OBSERVED_SURFACE_FEATURES));
    expect(result.records.map((row) => row.features.length)).toEqual([5, 3, 3]);
    expect(result).toMatchObject({
      status: "categorical-observed-feature-comparator-only",
      rival: "M-SR",
      transportMatched: false,
      numericScoreAvailable: false,
      mechanismRankingAvailable: false,
      morphologyInferenceAvailable: false,
      causalInferenceAvailable: false,
      physicalPromotionEligible: false,
      grantsValidationClaim: false,
    });
    expect(() => phase9ObservedSurfaceFeatureComparison({
      ...observedInput(),
      sourceRoster: ["nelson-swanson-2019"],
    })).toThrow(/exact categorical/u);
    expect(() => phase9ObservedSurfaceFeatureComparison({
      ...observedInput(),
      transportMatching: "matched",
    } as unknown as Phase9ObservedFeatureComparisonInput)).toThrow(/exact categorical/u);
    expect(() => phase9ObservedSurfaceFeatureComparison({
      ...observedInput(),
      sourceRoster: new Array(3),
    } as Phase9ObservedFeatureComparisonInput)).toThrow(/exact categorical/u);
  });
});

describe("Phase 9 S9 purpose refusals", () => {
  it("admits only diagnostics and limited feature replay, with every score and promotion false", () => {
    const purposes: readonly Phase9HollowingPurpose[] = [
      "normalized-width-law-shape",
      "manufactured-width-estimator",
      "hp26-rim-feature-source-replay",
      "observed-spatial-roughness-feature-comparison",
      "physical-width-law",
      "mss-exact-equation-evaluation",
      "absolute-forcing-response",
      "mechanism-ranking",
      "morphology-or-causal-claim",
      "physical-module-promotion",
      "quantitative-validation",
      "three-dimensional-campaign",
    ];
    const results = purposes.map(phase9HollowingEligibility);
    expect(results.map((row) => row.status)).toEqual([
      "diagnostic-eligible",
      "diagnostic-eligible",
      "eligible-with-limitation",
      "eligible-with-limitation",
      "source-blocked",
      "source-blocked",
      "source-blocked",
      "ineligible",
      "ineligible",
      "ineligible",
      "ineligible",
      "ineligible",
    ]);
    expect(results.map((row) => row.reasonCode)).toEqual([
      "NORMALIZED_DIAGNOSTIC_ONLY",
      "NORMALIZED_DIAGNOSTIC_ONLY",
      "SAME_LINEAGE_CATEGORICAL_REPLAY_ONLY",
      "SAME_LINEAGE_CATEGORICAL_REPLAY_ONLY",
      "PRINCETON_W0_AND_PHYSICAL_WIDTH_MAPPING_UNRESOLVED",
      "P9B_MISSING_HP26_EXACT_EQUATIONS",
      "HP25_ABSOLUTE_FORCING_SEMANTICS_UNRESOLVED",
      "UNMATCHED_TRANSPORT_AND_NO_COMMON_NUMERIC_CODEBOOK",
      "MORPHOLOGY_AND_CAUSAL_INFERENCE_FORBIDDEN",
      "PRESCORE_FOUNDATION_CANNOT_PROMOTE",
      "PHASE9_CANNOT_GRANT_VALIDATION",
      "NO_3D_PROTOCOL_OR_RESOURCE_AUTHORIZATION",
    ]);
    expect(results.every((row) => !row.sourceDataScoreEligible &&
      !row.mechanismRankingEligible && !row.physicalPromotionEligible &&
      !row.grantsValidationClaim && !row.threeDimensionalCampaignEligible)).toBe(true);
    expect(protocol().allowedPurposes).toEqual(purposes.slice(0, 4));
    expect(Object.keys(protocol().refusedPurposes)).toEqual(purposes.slice(4));
  });

  it("keeps exact claim boundaries and rival statuses fail-closed", () => {
    const frozen = protocol();
    expect(frozen.rivals["M-SS"]).toMatchObject({
      status: "source-blocked",
      reasonCode: "P9B-MISSING-HP26",
    });
    expect(frozen.rivals["M-W"].unavailable).toEqual([
      "physical w",
      "physical w0",
      "lattice-to-width mapping",
      "newer Princeton edition comparison",
      "physical source score",
    ]);
    expect(frozen.claimBoundary.forbidden).toEqual([
      "physical w or w0 mapping",
      "absolute conversion of the 48 or 20 source labels",
      "invented M-SS equations or executable closure",
      "numeric M-SR score without a frozen codebook and trajectory extraction",
      "mechanism ranking under unmatched transport",
      "hollowing morphology prediction",
      "causal confirmation",
      "physical promotion",
      "quantitative validation",
      "three-dimensional campaign authorization",
    ]);
  });
});
