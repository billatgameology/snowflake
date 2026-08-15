import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import {
  PHASE9_MGT_CLAIM_BOUNDARY,
  PHASE9_MGT_FUTURE_3D_BLOCKERS,
  PHASE9_MGT_GRID_CELLS_PER_RADIUS,
  PHASE9_MGT_MANUFACTURED_GIBBS_THOMSON_LENGTH_M,
  PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS,
  PHASE9_MGT_MANUFACTURED_COARSE_RELATIVE_ERROR,
  PHASE9_MGT_ONE_FACTOR_RESIDUAL_BOUND_ULPS,
  PHASE9_MGT_P2_SCALE_CONTEXT,
  PHASE9_MGT_PROTOCOL_ID,
  PHASE9_MGT_RADIUS_DOMAIN_M,
  PHASE9_MGT_SIGMA_SURFACE_DOMAIN,
  phase9MgtEligibility,
  phase9MgtGridConvergenceDiagnostic,
  phase9MgtManufacturedSecondOrderSamples,
  phase9MgtOneFactorComparison,
  phase9MgtSphericalCorrection,
  type Phase9MgtGridInput,
  type Phase9MgtRequestedPurpose,
  type Phase9MgtSphericalInput,
} from "../src/phase9-mgt-analytic.ts";

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface ShelfRestriction {
  readonly artifactSha256: string;
  readonly id: string;
  readonly kind: string;
  readonly text: string;
}

interface ProtocolShelfRestriction extends ShelfRestriction {
  readonly localDisposition: "retained-as-physical-score-block";
  readonly localHandling: string;
}

interface MgtShelf {
  readonly item: "M-GT";
  readonly sourceBlocked: false;
  readonly sourceBlockerPresent: false;
  readonly sourceBlockerIds: readonly [];
  readonly sourceBlockerStatuses: readonly [];
  readonly blockerIdentities: readonly [];
  readonly completeArtifactCount: 1;
  readonly completeArtifactSha256: readonly string[];
  readonly protocolDispositionRequired: true;
  readonly protocolDispositionState: "pending";
  readonly protocolRestrictions: readonly ShelfRestriction[];
}

interface ProtocolMgtShelf extends Omit<MgtShelf, "protocolRestrictions"> {
  readonly protocolRestrictions: readonly ProtocolShelfRestriction[];
}

interface KnowledgeSourceRecord {
  readonly schema: string;
  readonly sourceId: string;
  readonly identity: Record<string, unknown>;
  readonly versionStatus: string;
  readonly local: {
    readonly path: string;
    readonly sha256: string;
    readonly retention: string;
  };
  readonly theoryFamilies: readonly string[];
  readonly loadBearingLocators: readonly string[];
  readonly evidenceStatus: string;
  readonly limits: readonly string[];
}

interface KnowledgeHypothesisRecord {
  readonly schema: string;
  readonly hypothesisId: string;
  readonly name: string;
  readonly phase9Role: string;
  readonly status: string;
  readonly proposition: string;
  readonly governingRelation: string;
  readonly variableStatus: Record<string, string>;
  readonly assumptions: readonly string[];
  readonly predicts: readonly string[];
  readonly phase8Targets: readonly string[];
  readonly strongestRivals: readonly string[];
  readonly cheapestDiscriminator: string;
  readonly weakensOrRejects: readonly string[];
  readonly sources: readonly string[];
  readonly claimBoundary: string;
}

interface MgtProtocol {
  readonly schema: "phase9-mgt-analytic-protocol-v1";
  readonly protocolId: string;
  readonly frozenDate: string;
  readonly adoptionCommit: string;
  readonly state: {
    readonly protocol: "frozen-before-any-three-dimensional-or-source-data-output";
    readonly sourceObservationsRead: 0;
    readonly measurementScoresProduced: 0;
    readonly publicationAuthorized: false;
    readonly physicalPromotionAuthorized: false;
    readonly threeDimensionalCampaignAuthorized: false;
    readonly phase9Role: "development-only-numerical-diagnostic-foundation";
    readonly grantsValidationClaim: false;
  };
  readonly implementationArtifacts: {
    readonly analyticModel: ArtifactIdentity;
    readonly focusedTest: ArtifactIdentity;
  };
  readonly upstreamBindings: {
    readonly sourceOverlay: {
      readonly artifactIndex: ArtifactIdentity;
      readonly report: ArtifactIdentity;
      readonly shelfFreeze: ArtifactIdentity;
      readonly sourceOverlay: ArtifactIdentity;
      readonly sourceAudits: ArtifactIdentity;
      readonly blockers: ArtifactIdentity;
      readonly sourceDispositions: ArtifactIdentity;
      readonly exactMgtShelf: ProtocolMgtShelf;
      readonly monographOverlayIdentity: {
        readonly canonicalPath: string;
        readonly byteLength: number;
        readonly sha256: string;
        readonly sourceIds: readonly string[];
      };
      readonly facetOverlayIdentity: {
        readonly canonicalPath: string;
        readonly byteLength: number;
        readonly sha256: string;
        readonly sourceIds: readonly string[];
        readonly declaredShelfItems: readonly string[];
        readonly protocolRestrictions: readonly Omit<ShelfRestriction, "artifactSha256">[];
      };
      readonly facetEquationReconciliation: {
        readonly equationLocator: string;
        readonly knowledgeRole: string;
        readonly s0bShelfRule: string;
        readonly physicalUse: string;
      };
    };
    readonly knowledgeBaseline: {
      readonly artifactIndex: ArtifactIdentity;
      readonly report: ArtifactIdentity;
      readonly sourceRegister: ArtifactIdentity;
      readonly hypotheses: ArtifactIdentity;
      readonly calculations: ArtifactIdentity;
      readonly searchReport: ArtifactIdentity;
      readonly researchReport: ArtifactIdentity;
      readonly exactSources: readonly KnowledgeSourceRecord[];
      readonly exactHypothesis: KnowledgeHypothesisRecord;
      readonly existingCalculationReference: {
        readonly recordCount: number;
        readonly radiusRangeUm: readonly [number, number];
        readonly sphericalShiftFractionRange: readonly [number, number];
        readonly use: string;
      };
    };
    readonly machinery: {
      readonly attachmentKinetics: ArtifactIdentity;
      readonly parameterTable: ArtifactIdentity;
      readonly ggMachinery: ArtifactIdentity;
      readonly lattice: ArtifactIdentity;
      readonly metrics: ArtifactIdentity;
    };
  };
  readonly analyticOperator: {
    readonly geometry: string;
    readonly curvatureConvention: string;
    readonly relation: string;
    readonly units: Record<string, string>;
    readonly manufacturedGibbsThomsonLengthM: number;
    readonly canonicalOperandStatus: string;
    readonly p2ScaleContext: typeof PHASE9_MGT_P2_SCALE_CONTEXT;
    readonly radiusDomainM: readonly [number, number];
    readonly sigmaSurfaceDomainFraction: readonly [number, number];
    readonly nonpositiveEffectiveDrive: string;
  };
  readonly oneFactorControl: {
    readonly baseline: string;
    readonly intervention: string;
    readonly heldBitIdentical: readonly string[];
    readonly forbiddenChanges: readonly string[];
    readonly binary64Residual: {
      readonly field: string;
      readonly definition: string;
      readonly boundUlps: number;
      readonly absoluteBoundFormula: string;
      readonly maximumAbsoluteBoundOverRegisteredDomain: number;
      readonly reviewObservedMagnitude: number;
      readonly justification: string;
    };
  };
  readonly manufacturedGrid: {
    readonly provenance: string;
    readonly cellsPerRadius: readonly number[];
    readonly coarseRelativeError: number;
    readonly identityToleranceUlps: number;
    readonly exactFixture: string;
    readonly expectedRelativeErrors: readonly number[];
    readonly expectedPairwiseOrders: readonly number[];
    readonly actualLatticeUse: string;
    readonly eligibilityRule: string;
  };
  readonly eligibility: {
    readonly allowedPurposes: readonly string[];
    readonly refusedPurposes: Readonly<Record<string, string>>;
  };
  readonly futureThreeDimensionalBlockers: readonly string[];
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
  };
}

const ROOT = resolve(import.meta.dirname, "../..");
const PROTOCOL_PATH = "research/phase9-mgt-analytic-protocol-v1.json";

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(ROOT, path), "utf8")) as T;
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(resolve(ROOT, path), "utf8")
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as T);
}

function fileIdentity(path: string): Omit<ArtifactIdentity, "path"> {
  const bytes = readFileSync(resolve(ROOT, path));
  return {
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function protocol(): MgtProtocol {
  return readJson<MgtProtocol>(PROTOCOL_PATH);
}

function sphericalInput(
  mode: Phase9MgtSphericalInput["mode"],
  radiusM = 1e-6,
  sigmaSurfaceFraction = 0.01,
): Phase9MgtSphericalInput {
  return {
    purpose: "registered-manufactured-spherical-diagnostic",
    geometry: "sphere",
    curvatureConvention: "positive-two-over-radius-for-convex-ice",
    mode,
    radiusM,
    sigmaSurfaceFraction,
    gibbsThomsonLengthM: mode === "zero-gibbs-thomson-term-control"
      ? 0
      : PHASE9_MGT_MANUFACTURED_GIBBS_THOMSON_LENGTH_M,
  };
}

const EXPECTED_CANONICAL_OPERAND_STATUS =
  "P4 manufactured fixture seeded by the P2 temperature-dependent uncertain derived scale; exact only as a diagnostic fixture operand, never a physical input, P1 measurement, fit, or metrological constant";

const EXPECTED_P2_SCALE_CONTEXT = {
  provenanceClass: "P2-temperature-dependent-uncertain-derived-scale",
  formula: "dSv = gammaSv / (cIce * kBoltzmann * temperatureK)",
  gammaSvCentralJPerM2: 0.106,
  gammaSvReportedUncertaintyJPerM2: 0.015,
  cIceApproximateM3: 3.1e28,
  cIceUncertaintyStatus: "unreported-in-bound-table",
  kBoltzmannJPerK: 1.380649e-23,
  examples: [
    {
      temperatureK: 233.15,
      centralM: 1.0622468917286136e-9,
      gammaOnlyLowerM: 9.119289353519229e-10,
      gammaOnlyUpperM: 1.2125648481053042e-9,
    },
    {
      temperatureK: 258.15,
      centralM: 9.593758001414925e-10,
      gammaOnlyLowerM: 8.236150737063756e-10,
      gammaOnlyUpperM: 1.0951365265766093e-9,
    },
    {
      temperatureK: 273.15,
      centralM: 9.066917913473414e-10,
      gammaOnlyLowerM: 7.783863491755478e-10,
      gammaOnlyUpperM: 1.034997233519135e-9,
    },
  ],
  exampleStatus:
    "scale examples only; gamma-only intervals omit unreported cIce uncertainty and do not define a physical-use domain",
  physicalUse: "blocked",
} as const;

const EXPECTED_NONPOSITIVE_DRIVE =
  "Report the threshold or negative diagnostic value and refuse a deposition update. Sublimation is absent from the permanent solver.";

const EXPECTED_EXISTING_CALCULATION_USE =
  "Existing project calculation is a scale reference only. The Phase 8 rows are not matched curvature interventions and are never scored by M-GT.";

const EXPECTED_ONE_FACTOR_CONTROL = {
  baseline:
    "Set dSv exactly to zero under mode zero-gibbs-thomson-term-control while retaining the same nonzero spherical curvature.",
  intervention: "Set dSv exactly to 1e-9 m under mode gibbs-thomson-intervention.",
  heldBitIdentical: [
    "purpose",
    "sphere geometry",
    "positive-convex curvature convention",
    "radiusM",
    "sigmaSurfaceFraction",
  ],
  forbiddenChanges: [
    "radius",
    "surface supersaturation",
    "geometry",
    "curvature sign",
    "any solver or attachment parameter",
  ],
  binary64Residual: {
    field: "binary64OneFactorIdentityResidual",
    definition:
      "The binary64-evaluated sum of effectiveSupersaturationChangeFraction and equilibriumShiftIncreaseFraction; it is a floating-point diagnostic, not an exact-arithmetic residual.",
    boundUlps: 8,
    absoluteBoundFormula:
      "8 * Number.EPSILON * max(abs(baseline sigmaEffective), abs(candidate sigmaEffective), abs(equilibriumShiftIncrease), Number.MIN_VALUE)",
    maximumAbsoluteBoundOverRegisteredDomain: 5.329070518200751e-16,
    reviewObservedMagnitude: 2.7755575615628914e-17,
    justification:
      "The reported identity is assembled through several binary64 multiply, subtract, and add operations; an eight-epsilon scale factor conservatively exceeds the observed 2.7755575615628914e-17 witness while remaining proportional to the registered operands.",
  },
} as const;

const EXPECTED_MANUFACTURED_GRID = {
  provenance: "registered-second-order-manufactured-sphere-fixture",
  cellsPerRadius: [8, 16, 32, 64],
  coarseRelativeError: 0.08,
  identityToleranceUlps: 8,
  exactFixture: "kappa_h = (2/R) * [1 + 0.08 * (8/N)^2], where N is cells per radius",
  expectedRelativeErrors: [0.08, 0.02, 0.005, 0.00125],
  expectedPairwiseOrders: [2, 2, 2],
  actualLatticeUse:
    "None. This deterministic fixture verifies convergence arithmetic and defines a future target; it is not evidence that a discrete stacked-triangular-lattice curvature estimator exists or converges.",
  eligibilityRule:
    "Eligibility requires every input estimate to be within eight binary64 ULPs of its exact manufactured fixture and the independently derived relative-error and pairwise-order identities to pass their bounds; any derived identity failure is refused.",
} as const;

const EXPECTED_ELIGIBILITY = {
  allowedPurposes: [
    "manufactured-spherical-correction",
    "manufactured-grid-convergence",
  ],
  refusedPurposes: {
    "phase8-measurement-score": "No matched Phase 8 curvature intervention exists.",
    "phase9-source-data-score": "No source-data scoring protocol or matched observation exists.",
    "physical-module-promotion": "A manufactured result cannot promote physical support.",
    "three-dimensional-campaign":
      "The discrete estimator, solver coupling, nonpositive-drive update, anisotropy policy, resource authorization, and actual grid/domain controls are absent.",
  },
} as const;

const EXPECTED_CLAIM_BOUNDARY = {
  allowed: [
    "Spherical algebraic relation evaluated in binary64 in the registered P4 calculation domain, with the one-factor residual checked against its registered bound",
    "Type-appropriate zero-term one-factor control",
    "Deterministic manufactured second-order convergence arithmetic",
    "Explicit refusal states and a concrete future 3-D prerequisite list",
  ],
  forbidden: [
    "Measured curvature agreement",
    "Phase 8 or Phase 9 source-data score",
    "Validation or quantitative-validation label",
    "Physical M-GT promotion",
    "Claim that an actual lattice curvature estimator converges",
    "Solver coupling, morphology improvement, or one-pixel-plate suppression claim",
    "Three-dimensional campaign authorization",
    "Claim that 1 nm is a physical input, exact metrological constant, P1 value, or new direct measurement",
    "Physical use of the P2 scale examples or their gamma-only uncertainty intervals",
  ],
} as const;

const EXPECTED_FACET_BINDING = {
  facetOverlayIdentity: {
    canonicalPath: "research-cache/content/2306.04042v1.pdf",
    byteLength: 1400163,
    sha256: "1ff2c1f9699c2aefd26e5373f29c4fdd7a110620c136bd349d813947dacbcd1f",
    sourceIds: ["P8B-CONT-3953FE9A14DC13EC535C9FA7", "P9K-LIB-FACET"],
    declaredShelfItems: ["M-K2", "M-F"],
    protocolRestrictions: [{
      id: "P9R-1FF2C1F9699C2AEF-EXTRACTION",
      kind: "extraction",
      text: "Use the printed annex for M-K2 replay; empirical observations stay lineage-labelled.",
    }],
  },
  facetEquationReconciliation: {
    equationLocator:
      "FACET PDF p. 4 Eq. 7: sigmaEffective = sigmaSurface - dSv*kappa; kappa = 2/R for a sphere",
    knowledgeRole:
      "The adopted knowledge baseline binds FACET for the manufactured M-GT equation identity only; it supplies no matched observation and no physical 1 nm input.",
    s0bShelfRule:
      "S0B remains byte-frozen and maps FACET only to M-K2/M-F. This protocol does not add FACET to S0B's one-artifact M-GT shelf or redisposition its annex restriction.",
    physicalUse:
      "blocked until a physical-input source/currency disposition, uncertainty treatment, discrete estimator, coupling policy, and matched experiment are separately frozen",
  },
} as const;

const EXPECTED_RESTRICTION_HANDLING = [
  {
    id: "P9R-F6CD58AB841F841B-ACQUISITION",
    localDisposition: "retained-as-physical-score-block",
    localHandling:
      "No monograph-only numeric input is adopted for a physical score. The rounded 1 nm value is a P4 manufactured fixture seeded by the P2 scale context; a physical arm stays blocked.",
  },
  {
    id: "P9R-F6CD58AB841F841B-CURRENCY_CURRENT_VERSION",
    localDisposition: "retained-as-physical-score-block",
    localHandling:
      "The unpublished edition comparison prevents a physical-input freeze and promotion. It does not prevent a manufactured identity that cannot score observations.",
  },
  {
    id: "P9R-F6CD58AB841F841B-CURRENCY_SUPPLEMENT",
    localDisposition: "retained-as-physical-score-block",
    localHandling:
      "No physical score, lattice coupling, or campaign can use this unresolved monograph lineage.",
  },
  {
    id: "P9R-F6CD58AB841F841B-EXTRACTION",
    localDisposition: "retained-as-physical-score-block",
    localHandling:
      "FACET supplies the separately bound printed spherical relation. The rounded 1 nm value is a P4 manufactured fixture, not a new P1 extraction, fitted physical value, or exact P2 input.",
  },
] as const;

function validateMgtProtocolSemantics(candidate: MgtProtocol): string[] {
  const failures: string[] = [];
  const exact = (label: string, actual: unknown, expected: unknown): void => {
    if (!isDeepStrictEqual(actual, expected)) failures.push(label);
  };
  exact("canonical operand status", candidate.analyticOperator.canonicalOperandStatus,
    EXPECTED_CANONICAL_OPERAND_STATUS);
  exact("manufactured operand", candidate.analyticOperator.manufacturedGibbsThomsonLengthM, 1e-9);
  exact("P2 scale context", candidate.analyticOperator.p2ScaleContext,
    EXPECTED_P2_SCALE_CONTEXT);
  exact("negative drive", candidate.analyticOperator.nonpositiveEffectiveDrive,
    EXPECTED_NONPOSITIVE_DRIVE);
  exact("existing calculation use boundary",
    candidate.upstreamBindings.knowledgeBaseline.existingCalculationReference.use,
    EXPECTED_EXISTING_CALCULATION_USE);
  exact("one-factor control", candidate.oneFactorControl, EXPECTED_ONE_FACTOR_CONTROL);
  exact("manufactured provenance, fixture, and no-lattice boundary",
    candidate.manufacturedGrid, EXPECTED_MANUFACTURED_GRID);
  exact("eligibility purposes", candidate.eligibility, EXPECTED_ELIGIBILITY);
  exact("claim boundary", candidate.claimBoundary, EXPECTED_CLAIM_BOUNDARY);
  exact("FACET overlay identity", candidate.upstreamBindings.sourceOverlay.facetOverlayIdentity,
    EXPECTED_FACET_BINDING.facetOverlayIdentity);
  exact("FACET equation reconciliation",
    candidate.upstreamBindings.sourceOverlay.facetEquationReconciliation,
    EXPECTED_FACET_BINDING.facetEquationReconciliation);
  exact("S0B restriction handling",
    candidate.upstreamBindings.sourceOverlay.exactMgtShelf.protocolRestrictions.map((row) => ({
      id: row.id,
      localDisposition: row.localDisposition,
      localHandling: row.localHandling,
    })),
    EXPECTED_RESTRICTION_HANDLING);
  return failures;
}

function mutateProtocolPath(
  candidate: MgtProtocol,
  path: readonly string[],
  replacement: unknown,
): void {
  let cursor = candidate as unknown as Record<string, unknown>;
  for (const segment of path.slice(0, -1)) {
    const next = cursor[segment];
    if (typeof next !== "object" || next === null) throw new Error(`missing ${segment}`);
    cursor = next as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = replacement;
}

function positiveBinary64AtIndependentUlpOffset(value: number, offset: number): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value, false);
  const bits = view.getBigUint64(0, false);
  view.setBigUint64(0, bits + BigInt(offset), false);
  return view.getFloat64(0, false);
}

describe("Phase 9 M-GT frozen foundation", () => {
  it("binds the diagnostic-only state and every tracked implementation identity", () => {
    const frozen = protocol();
    expect(frozen.schema).toBe("phase9-mgt-analytic-protocol-v1");
    expect(frozen.protocolId).toBe(PHASE9_MGT_PROTOCOL_ID);
    expect(frozen.frozenDate).toBe("2026-08-13");
    expect(frozen.adoptionCommit).toBe("f936920edce283e90a947ee34846776da8b1859a");
    expect(frozen.state).toEqual({
      protocol: "frozen-before-any-three-dimensional-or-source-data-output",
      sourceObservationsRead: 0,
      measurementScoresProduced: 0,
      publicationAuthorized: false,
      physicalPromotionAuthorized: false,
      threeDimensionalCampaignAuthorized: false,
      phase9Role: "development-only-numerical-diagnostic-foundation",
      grantsValidationClaim: false,
    });
    for (const artifact of Object.values(frozen.implementationArtifacts)) {
      expect(fileIdentity(artifact.path), artifact.path).toEqual({
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
      });
    }
    expect(PHASE9_MGT_CLAIM_BOUNDARY).toEqual({
      phase9Role: "development-only-numerical-diagnostic",
      consumesSourceObservations: false,
      measurementScoreAvailable: false,
      physicalPromotionAvailable: false,
      threeDimensionalCampaignAvailable: false,
      solverCouplingAvailable: false,
      grantsValidationClaim: false,
    });
  });

  it("independently validates every load-bearing protocol semantic", () => {
    expect(validateMgtProtocolSemantics(protocol())).toEqual([]);
  });

  it("executes and rejects semantic mutations instead of trusting protocol self-description", () => {
    const cases: readonly {
      readonly label: string;
      readonly path: readonly string[];
      readonly replacement: unknown;
    }[] = [
      {
        label: "canonical operand status",
        path: ["analyticOperator", "canonicalOperandStatus"],
        replacement: "P1 exact physical constant",
      },
      {
        label: "negative drive",
        path: ["analyticOperator", "nonpositiveEffectiveDrive"],
        replacement: "Clamp and apply deposition update.",
      },
      {
        label: "existing calculation use boundary",
        path: [
          "upstreamBindings",
          "knowledgeBaseline",
          "existingCalculationReference",
          "use",
        ],
        replacement: "The Phase 8 rows are matched curvature interventions scored by M-GT.",
      },
      {
        label: "one-factor control",
        path: ["oneFactorControl", "heldBitIdentical"],
        replacement: ["radiusM"],
      },
      {
        label: "manufactured provenance, fixture, and no-lattice boundary",
        path: ["manufacturedGrid", "provenance"],
        replacement: "three-dimensional-lattice-observation",
      },
      {
        label: "manufactured provenance, fixture, and no-lattice boundary",
        path: ["manufacturedGrid", "exactFixture"],
        replacement: "kappa_h = fitted data",
      },
      {
        label: "manufactured provenance, fixture, and no-lattice boundary",
        path: ["manufacturedGrid", "actualLatticeUse"],
        replacement: "Executed lattice campaign.",
      },
      {
        label: "eligibility purposes",
        path: ["eligibility", "allowedPurposes"],
        replacement: ["phase8-measurement-score"],
      },
      {
        label: "claim boundary",
        path: ["claimBoundary", "allowed"],
        replacement: ["Measured curvature agreement"],
      },
      {
        label: "FACET overlay identity",
        path: ["upstreamBindings", "sourceOverlay", "facetOverlayIdentity", "declaredShelfItems"],
        replacement: ["M-K2", "M-F", "M-GT"],
      },
      {
        label: "FACET equation reconciliation",
        path: ["upstreamBindings", "sourceOverlay", "facetEquationReconciliation", "physicalUse"],
        replacement: "allowed",
      },
      {
        label: "S0B restriction handling",
        path: [
          "upstreamBindings",
          "sourceOverlay",
          "exactMgtShelf",
          "protocolRestrictions",
          "0",
          "localHandling",
        ],
        replacement: "restriction resolved",
      },
    ];
    for (const mutation of cases) {
      const candidate = structuredClone(protocol());
      const before = JSON.stringify(candidate);
      mutateProtocolPath(candidate, mutation.path, mutation.replacement);
      expect(JSON.stringify(candidate), mutation.path.join(".")).not.toBe(before);
      expect(validateMgtProtocolSemantics(candidate), mutation.path.join(".")).toContain(
        mutation.label,
      );
    }
  });

  it("exact-binds the final S0B bytes and retains every M-GT restriction as a physical-score block", () => {
    const binding = protocol().upstreamBindings.sourceOverlay;
    for (const artifact of [
      binding.artifactIndex,
      binding.report,
      binding.shelfFreeze,
      binding.sourceOverlay,
      binding.sourceAudits,
      binding.blockers,
      binding.sourceDispositions,
    ]) {
      expect(fileIdentity(artifact.path), artifact.path).toEqual({
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
      });
    }

    const shelf = readJson<{ readonly shelf: readonly MgtShelf[] }>(binding.shelfFreeze.path)
      .shelf.find((row) => row.item === "M-GT");
    expect(shelf).toBeDefined();
    const stripped = {
      ...binding.exactMgtShelf,
      protocolRestrictions: binding.exactMgtShelf.protocolRestrictions.map(({
        localDisposition: _localDisposition,
        localHandling: _localHandling,
        ...restriction
      }) => restriction),
    };
    expect(stripped).toEqual(shelf);
    expect(binding.exactMgtShelf.completeArtifactSha256).toEqual([
      "f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471",
    ]);
    expect(binding.exactMgtShelf.protocolRestrictions).toHaveLength(4);
    expect(
      binding.exactMgtShelf.protocolRestrictions.every(
        (row) =>
          row.localDisposition === "retained-as-physical-score-block" &&
          row.localHandling.length > 0,
      ),
    ).toBe(true);

    const overlayRows = readJsonl<{
      readonly canonicalPath: string;
      readonly byteLength: number;
      readonly sha256: string;
      readonly aliases: readonly { readonly sourceId: string }[];
      readonly disposition: {
        readonly shelfItems: readonly string[];
        readonly protocolDisposition: {
          readonly restrictions: readonly Omit<ShelfRestriction, "artifactSha256">[];
        };
      };
    }>(binding.sourceOverlay.path);
    const monograph = overlayRows.find(
      (row) => row.sha256 === binding.monographOverlayIdentity.sha256,
    );
    expect(monograph).toBeDefined();
    expect({
      canonicalPath: monograph?.canonicalPath,
      byteLength: monograph?.byteLength,
      sha256: monograph?.sha256,
      sourceIds: monograph?.aliases.map((row) => row.sourceId),
    }).toEqual(binding.monographOverlayIdentity);
    const facet = overlayRows.find(
      (row) => row.sha256 === binding.facetOverlayIdentity.sha256,
    );
    expect({
      canonicalPath: facet?.canonicalPath,
      byteLength: facet?.byteLength,
      sha256: facet?.sha256,
      sourceIds: facet?.aliases.map((row) => row.sourceId),
      declaredShelfItems: facet?.disposition.shelfItems,
      protocolRestrictions: facet?.disposition.protocolDisposition.restrictions,
    }).toEqual(binding.facetOverlayIdentity);
    expect(binding.exactMgtShelf.completeArtifactSha256).not.toContain(
      binding.facetOverlayIdentity.sha256,
    );
  });

  it("exact-binds the knowledge files, equation sources, hypothesis, and prior diagnostic range", () => {
    const binding = protocol().upstreamBindings.knowledgeBaseline;
    for (const artifact of [
      binding.artifactIndex,
      binding.report,
      binding.sourceRegister,
      binding.hypotheses,
      binding.calculations,
      binding.searchReport,
      binding.researchReport,
    ]) {
      expect(fileIdentity(artifact.path), artifact.path).toEqual({
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
      });
    }

    const sources = readJsonl<KnowledgeSourceRecord>(binding.sourceRegister.path)
      .filter((row) => ["P9K-LIB-MONOGRAPH", "P9K-LIB-FACET"].includes(row.sourceId));
    expect(sources).toEqual(binding.exactSources);
    const hypothesis = readJsonl<KnowledgeHypothesisRecord>(binding.hypotheses.path)
      .find((row) => row.hypothesisId === "P9H-GIBBS-THOMSON");
    expect(hypothesis).toEqual(binding.exactHypothesis);
    expect(binding.exactHypothesis.phase8Targets).toEqual([]);
    expect(binding.exactHypothesis.sources).toEqual([
      "P9K-LIB-MONOGRAPH",
      "P9K-LIB-FACET",
    ]);

    const calculation = readJson<{
      readonly transportAndCurvatureRegimes: {
        readonly phase8InitialRows: readonly {
          readonly initialRadiusUm: number;
          readonly sphericalGibbsThomsonEquilibriumShiftFraction: number;
        }[];
      };
      readonly claimBoundary: {
        readonly scoresModelAgainstMeasurements: boolean;
        readonly grantsValidationClaim: boolean;
      };
    }>(binding.calculations.path);
    const rows = calculation.transportAndCurvatureRegimes.phase8InitialRows;
    expect({
      recordCount: rows.length,
      radiusRangeUm: [
        Math.min(...rows.map((row) => row.initialRadiusUm)),
        Math.max(...rows.map((row) => row.initialRadiusUm)),
      ],
      sphericalShiftFractionRange: [
        Math.min(...rows.map((row) => row.sphericalGibbsThomsonEquilibriumShiftFraction)),
        Math.max(...rows.map((row) => row.sphericalGibbsThomsonEquilibriumShiftFraction)),
      ],
      use: EXPECTED_EXISTING_CALCULATION_USE,
    }).toEqual(binding.existingCalculationReference);
    expect(calculation.claimBoundary).toMatchObject({
      scoresModelAgainstMeasurements: false,
      grantsValidationClaim: false,
    });
  });

  it("binds the unchanged lattice, metric, parameter, and attachment specifications", () => {
    const machinery = protocol().upstreamBindings.machinery;
    for (const artifact of Object.values(machinery)) {
      expect(fileIdentity(artifact.path), artifact.path).toEqual({
        byteLength: artifact.byteLength,
        sha256: artifact.sha256,
      });
    }
    const modelBytes = readFileSync(
      resolve(ROOT, protocol().implementationArtifacts.analyticModel.path),
      "utf8",
    );
    expect(modelBytes).not.toMatch(/node:fs|readFileSync|writeFileSync/u);
    expect(modelBytes).not.toMatch(/solver-cpu|GGSolver|LKSolver/u);
  });

  it("keeps protocol arithmetic, units, grid roster, and future blockers synchronized with code", () => {
    const frozen = protocol();
    expect(frozen.analyticOperator).toMatchObject({
      geometry: "sphere only",
      curvatureConvention: "positive convex ice; kappa = 2/R",
      relation: "sigmaEffective = sigmaSurface - dSv*kappa",
      manufacturedGibbsThomsonLengthM: PHASE9_MGT_MANUFACTURED_GIBBS_THOMSON_LENGTH_M,
      radiusDomainM: [PHASE9_MGT_RADIUS_DOMAIN_M.minimum, PHASE9_MGT_RADIUS_DOMAIN_M.maximum],
      sigmaSurfaceDomainFraction: [
        PHASE9_MGT_SIGMA_SURFACE_DOMAIN.minimum,
        PHASE9_MGT_SIGMA_SURFACE_DOMAIN.maximum,
      ],
    });
    expect(frozen.analyticOperator.p2ScaleContext).toEqual(PHASE9_MGT_P2_SCALE_CONTEXT);
    expect(frozen.analyticOperator.units).toEqual({
      radius: "m",
      gibbsThomsonLength: "m",
      meanCurvature: "m^-1",
      sigmaSurface: "dimensionless fraction, never percent",
      equilibriumShift: "dimensionless fraction",
      sigmaEffective: "dimensionless fraction",
    });
    expect(frozen.manufacturedGrid.cellsPerRadius).toEqual(PHASE9_MGT_GRID_CELLS_PER_RADIUS);
    expect(frozen.manufacturedGrid.coarseRelativeError).toBe(
      PHASE9_MGT_MANUFACTURED_COARSE_RELATIVE_ERROR,
    );
    expect(frozen.manufacturedGrid.identityToleranceUlps).toBe(
      PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS,
    );
    expect(frozen.oneFactorControl.binary64Residual.boundUlps).toBe(
      PHASE9_MGT_ONE_FACTOR_RESIDUAL_BOUND_ULPS,
    );
    expect(frozen.manufacturedGrid.expectedRelativeErrors).toEqual([
      0.08,
      0.02,
      0.005,
      0.00125,
    ]);
    expect(frozen.manufacturedGrid.expectedPairwiseOrders).toEqual([2, 2, 2]);
    expect(frozen.futureThreeDimensionalBlockers).toEqual(PHASE9_MGT_FUTURE_3D_BLOCKERS);
  });
});

describe("Phase 9 M-GT spherical arithmetic", () => {
  it("independently reproduces the exact spherical correction at representative radii", () => {
    const cases = [
      { radiusM: 1e-7, expectedShift: 0.02 },
      { radiusM: 1e-6, expectedShift: 0.002 },
      { radiusM: 5.8e-6, expectedShift: 0.0003448275862068966 },
      { radiusM: 12e-6, expectedShift: 0.00016666666666666666 },
      { radiusM: 1e-4, expectedShift: 0.00002 },
    ];
    for (const { radiusM, expectedShift } of cases) {
      const input = sphericalInput("gibbs-thomson-intervention", radiusM, 0.03);
      const result = phase9MgtSphericalCorrection(input);
      const independentCurvature = 2 / radiusM;
      const independentShift = 1e-9 * independentCurvature;
      expect(result.exactMeanCurvatureM1).toBe(independentCurvature);
      expect(result.equilibriumShiftFraction).toBe(independentShift);
      expect(result.equilibriumShiftFraction).toBeCloseTo(expectedShift, 15);
      expect(result.effectiveSupersaturationFraction).toBe(0.03 - independentShift);
      expect(result).toMatchObject({
        status: "manufactured-spherical-diagnostic-only",
        sourceDataScoreProduced: false,
        physicalPromotionEligible: false,
        threeDimensionalCampaignEligible: false,
        grantsValidationClaim: false,
      });
    }
  });

  it("labels positive, exact-equilibrium, and negative effective drive without applying any update", () => {
    expect(
      phase9MgtSphericalCorrection(
        sphericalInput("gibbs-thomson-intervention", 1e-6, 0.01),
      ).driveDisposition,
    ).toBe("positive-effective-drive-diagnostic-only");
    expect(
      phase9MgtSphericalCorrection(
        sphericalInput("gibbs-thomson-intervention", 1e-6, 0.002),
      ).driveDisposition,
    ).toBe("equilibrium-threshold-diagnostic-only");
    const negative = phase9MgtSphericalCorrection(
      sphericalInput("gibbs-thomson-intervention", 1e-7, 0.01),
    );
    expect(negative.effectiveSupersaturationFraction).toBe(-0.01);
    expect(negative.driveDisposition).toBe(
      "deposition-update-refused-nonpositive-effective-drive",
    );
  });

  it("compares the zero-term control with the intervention while holding all other operands fixed", () => {
    const baseline = sphericalInput("zero-gibbs-thomson-term-control", 1e-6, 0.01);
    const candidate = sphericalInput("gibbs-thomson-intervention", 1e-6, 0.01);
    const comparison = phase9MgtOneFactorComparison(baseline, candidate);
    expect(comparison.status).toBe("manufactured-one-factor-diagnostic-only");
    if (comparison.status !== "manufactured-one-factor-diagnostic-only") return;
    expect(comparison.baseline.equilibriumShiftFraction).toBe(0);
    expect(comparison.baseline.effectiveSupersaturationFraction).toBe(0.01);
    expect(comparison.candidate.equilibriumShiftFraction).toBe(0.002);
    expect(comparison.candidate.effectiveSupersaturationFraction).toBe(0.008);
    expect(comparison.equilibriumShiftIncreaseFraction).toBe(0.002);
    expect(comparison.effectiveSupersaturationChangeFraction).toBe(-0.002);
    expect(comparison.binary64OneFactorIdentityResidual).toBe(0);
    expect(comparison.binary64OneFactorIdentityWithinBound).toBe(true);
    expect(comparison.binary64OneFactorIdentityAbsoluteBound).toBeGreaterThanOrEqual(0);
  });

  it("reports a nonzero binary64 identity witness within the registered conservative bound", () => {
    const comparison = phase9MgtOneFactorComparison(
      sphericalInput("zero-gibbs-thomson-term-control", 8e-6, 0.26),
      sphericalInput("gibbs-thomson-intervention", 8e-6, 0.26),
    );
    expect(comparison.status).toBe("manufactured-one-factor-diagnostic-only");
    if (comparison.status !== "manufactured-one-factor-diagnostic-only") return;
    expect(Math.abs(comparison.binary64OneFactorIdentityResidual)).toBe(
      2.7538735181131813e-17,
    );
    expect(Math.abs(comparison.binary64OneFactorIdentityResidual)).toBeLessThanOrEqual(
      comparison.binary64OneFactorIdentityAbsoluteBound,
    );
    expect(comparison.binary64OneFactorIdentityAbsoluteBound).toBeGreaterThan(
      protocol().oneFactorControl.binary64Residual.reviewObservedMagnitude,
    );
  });

  it("refuses a reversed control and any second changed operand", () => {
    expect(
      phase9MgtOneFactorComparison(
        sphericalInput("gibbs-thomson-intervention"),
        sphericalInput("zero-gibbs-thomson-term-control"),
      ),
    ).toMatchObject({
      status: "refused",
      reasonCode: "CONTROL_AND_INTERVENTION_ORDER_REQUIRED",
    });
    expect(
      phase9MgtOneFactorComparison(
        sphericalInput("zero-gibbs-thomson-term-control", 1e-6, 0.01),
        sphericalInput("gibbs-thomson-intervention", 2e-6, 0.01),
      ),
    ).toMatchObject({ status: "refused", reasonCode: "NON_INTERVENTION_OPERAND_CHANGED" });
    expect(
      phase9MgtOneFactorComparison(
        sphericalInput("zero-gibbs-thomson-term-control", 1e-6, 0.01),
        sphericalInput("gibbs-thomson-intervention", 1e-6, 0.02),
      ),
    ).toMatchObject({ status: "refused", reasonCode: "NON_INTERVENTION_OPERAND_CHANGED" });
  });

  it("fails closed on wrong purpose, geometry, units-like percent input, domain, and term value", () => {
    const base = sphericalInput("gibbs-thomson-intervention");
    expect(() => phase9MgtSphericalCorrection({
      ...base,
      purpose: "physical-source-score",
    } as unknown as Phase9MgtSphericalInput)).toThrow(/purpose/u);
    expect(() => phase9MgtSphericalCorrection({
      ...base,
      geometry: "hexagonal-prism",
    } as unknown as Phase9MgtSphericalInput)).toThrow(/sphere/u);
    expect(() => phase9MgtSphericalCorrection({
      ...base,
      curvatureConvention: "negative-convex",
    } as unknown as Phase9MgtSphericalInput)).toThrow(/convention/u);
    expect(() => phase9MgtSphericalCorrection({ ...base, radiusM: 0 })).toThrow(/radius/u);
    expect(() => phase9MgtSphericalCorrection({ ...base, radiusM: 1e-3 })).toThrow(/radius/u);
    expect(() => phase9MgtSphericalCorrection({
      ...base,
      sigmaSurfaceFraction: 1,
    })).toThrow(/supersaturation/u);
    expect(() => phase9MgtSphericalCorrection({
      ...base,
      gibbsThomsonLengthM: 3e-10,
    })).toThrow(/1e-9/u);
    expect(() => phase9MgtSphericalCorrection({
      ...sphericalInput("zero-gibbs-thomson-term-control"),
      gibbsThomsonLengthM: 1e-9,
    })).toThrow(/exactly zero/u);
    expect(() => phase9MgtSphericalCorrection({ ...base, radiusM: Number.NaN })).toThrow(/finite/u);
  });
});

describe("Phase 9 M-GT manufactured grid diagnostic", () => {
  it("re-derives the exact four-level second-order fixture and correction convergence", () => {
    const intervention = sphericalInput("gibbs-thomson-intervention", 1e-6, 0.01);
    const input: Phase9MgtGridInput = {
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples: phase9MgtManufacturedSecondOrderSamples(intervention),
    };
    const result = phase9MgtGridConvergenceDiagnostic(input);
    expect(result.status).toBe("manufactured-grid-convergence-diagnostic-only");
    if (result.status !== "manufactured-grid-convergence-diagnostic-only") return;

    const exactCurvature = 2 / 1e-6;
    const expectedRelativeErrors = [0.08, 0.02, 0.005, 0.00125];
    expect(result.exactMeanCurvatureM1).toBe(exactCurvature);
    expect(result.samples.map((row) => row.cellsPerRadius)).toEqual([8, 16, 32, 64]);
    result.samples.forEach((row, index) => {
      const independentEstimate = exactCurvature * (1 + expectedRelativeErrors[index]);
      expect(row.latticeSpacingM).toBe(1e-6 / [8, 16, 32, 64][index]);
      expect(row.estimatedMeanCurvatureM1).toBe(independentEstimate);
      expect(row.relativeCurvatureError).toBeCloseTo(expectedRelativeErrors[index], 14);
      expect(row.estimatedEquilibriumShiftFraction).toBe(1e-9 * independentEstimate);
      expect(row.estimatedEffectiveSupersaturationFraction).toBe(
        0.01 - 1e-9 * independentEstimate,
      );
    });
    expect(result.pairwiseObservedOrders).toEqual([
      expect.closeTo(2, 12),
      expect.closeTo(2, 12),
      expect.closeTo(2, 12),
    ]);
    expect(result.relativeErrorsStrictlyDecrease).toBe(true);
    expect(result.manufacturedSecondOrderIdentitySatisfied).toBe(true);
    expect(result.finestRelativeCurvatureError).toBeCloseTo(0.00125, 14);
    expect(result).toMatchObject({
      manufacturedDiagnosticEligible: true,
      sourceDataScoreProduced: false,
      physicalPromotionEligible: false,
      threeDimensionalCampaignEligible: false,
      grantsValidationClaim: false,
    });
  });

  it("refuses a future 3-D provenance, wrong ladder roster, and mutated fixture", () => {
    const intervention = sphericalInput("gibbs-thomson-intervention");
    const samples = phase9MgtManufacturedSecondOrderSamples(intervention);
    expect(phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "future-three-dimensional-lattice-estimator",
      sphericalIntervention: intervention,
      samples,
    })).toMatchObject({
      status: "refused",
      reasonCode: "THREE_DIMENSIONAL_CAMPAIGN_NOT_AUTHORIZED",
    });
    expect(phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples: samples.slice(0, 3),
    })).toMatchObject({ status: "refused", reasonCode: "GRID_LEVEL_ROSTER_MISMATCH" });
    const mutated = samples.map((row, index) =>
      index === 2
        ? { ...row, estimatedMeanCurvatureM1: row.estimatedMeanCurvatureM1 * 1.01 }
        : row
    );
    expect(phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples: mutated,
    })).toMatchObject({
      status: "refused",
      reasonCode: "MANUFACTURED_FIXTURE_IDENTITY_MISMATCH",
    });
  });

  it("admits the frozen eight-ULP fixture boundary and refuses the ninth ULP", () => {
    const intervention = sphericalInput("gibbs-thomson-intervention");
    const samples = phase9MgtManufacturedSecondOrderSamples(intervention);
    const atBoundary = samples.map((row, index) => index === 3
      ? {
        ...row,
        estimatedMeanCurvatureM1: positiveBinary64AtIndependentUlpOffset(
          row.estimatedMeanCurvatureM1,
          PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS,
        ),
      }
      : row);
    expect(phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples: atBoundary,
    })).toMatchObject({
      status: "manufactured-grid-convergence-diagnostic-only",
      manufacturedSecondOrderIdentitySatisfied: true,
      manufacturedDiagnosticEligible: true,
    });

    const outsideBoundary = samples.map((row, index) => index === 3
      ? {
        ...row,
        estimatedMeanCurvatureM1: positiveBinary64AtIndependentUlpOffset(
          row.estimatedMeanCurvatureM1,
          PHASE9_MGT_MANUFACTURED_IDENTITY_TOLERANCE_ULPS + 1,
        ),
      }
      : row);
    expect(phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples: outsideBoundary,
    })).toMatchObject({
      status: "refused",
      reasonCode: "MANUFACTURED_FIXTURE_IDENTITY_MISMATCH",
      manufacturedDiagnosticEligible: false,
    });
  });

  it("throws on malformed grid purpose, control substitution, and nonpositive estimate", () => {
    const intervention = sphericalInput("gibbs-thomson-intervention");
    const samples = phase9MgtManufacturedSecondOrderSamples(intervention);
    expect(() => phase9MgtGridConvergenceDiagnostic({
      purpose: "physical-grid-gate",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples,
    } as unknown as Phase9MgtGridInput)).toThrow(/purpose/u);
    expect(() => phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: sphericalInput("zero-gibbs-thomson-term-control"),
      samples,
    })).toThrow(/intervention/u);
    expect(() => phase9MgtGridConvergenceDiagnostic({
      purpose: "registered-manufactured-grid-convergence-diagnostic",
      provenance: "registered-second-order-manufactured-sphere-fixture",
      sphericalIntervention: intervention,
      samples: samples.map((row, index) =>
        index === 0 ? { ...row, estimatedMeanCurvatureM1: 0 } : row
      ),
    })).toThrow(/positive/u);
  });
});

describe("Phase 9 M-GT purpose eligibility", () => {
  it("admits only the two manufactured purposes and never grants a score or promotion", () => {
    const purposes: readonly Phase9MgtRequestedPurpose[] = [
      "manufactured-spherical-correction",
      "manufactured-grid-convergence",
      "phase8-measurement-score",
      "phase9-source-data-score",
      "physical-module-promotion",
      "three-dimensional-campaign",
    ];
    const results = purposes.map(phase9MgtEligibility);
    expect(results.map((row) => row.status)).toEqual([
      "diagnostic-eligible",
      "diagnostic-eligible",
      "ineligible",
      "source-blocked",
      "ineligible",
      "source-blocked",
    ]);
    expect(results.map((row) => row.reasonCode)).toEqual([
      "MANUFACTURED_DIAGNOSTIC_ONLY",
      "MANUFACTURED_DIAGNOSTIC_ONLY",
      "NO_MATCHED_CURVATURE_INTERVENTION",
      "NO_SOURCE_DATA_SCORING_PROTOCOL",
      "PHYSICAL_PROMOTION_FORBIDDEN_WITHOUT_MATCHED_EXPERIMENT",
      "THREE_DIMENSIONAL_FOUNDATION_INCOMPLETE",
    ]);
    expect(results.every((row) =>
      row.measurementScoreEligible === false &&
      row.physicalPromotionEligible === false &&
      row.threeDimensionalCampaignEligible === false &&
      row.grantsValidationClaim === false
    )).toBe(true);
  });
});
