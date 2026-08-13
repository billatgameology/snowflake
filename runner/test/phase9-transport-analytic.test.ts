import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import {
  PHASE9_TRANSPORT_PROTOCOL_ID,
  PHASE9_TRANSPORT_QUANTITATIVE_PURPOSES,
  PHASE9_TRANSPORT_SD71_SELECTION_IDS,
  phase9LatentHeatingPrintedAnchor,
  phase9TransportOneFactorManufacturedComparison,
  phase9TransportResistanceBreakdown,
  phase9TransportSd71QuantitativeGate,
  type Phase9TransportQuantitativePurpose,
  type Phase9TransportResistanceInput,
} from "../src/phase9-transport-analytic.ts";

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

interface CommonShelf {
  readonly items: readonly ["M-PT", "M-LH"];
  readonly sourceBlocked: false;
  readonly protocolDispositionRequired: true;
  readonly protocolDispositionState: "pending";
  readonly sourceBlockerPresent: true;
  readonly sourceBlockerIds: readonly ["P9B-MISSING-KH82"];
  readonly sourceBlockerStatuses: readonly ["arm-freeze-blocked"];
  readonly blockerIdentities: readonly string[];
  readonly completeArtifactCount: 10;
  readonly completeArtifactSha256: readonly string[];
  readonly protocolRestrictions: readonly ShelfRestriction[];
}

interface TransportProtocol {
  readonly schema: "phase9-transport-analytic-protocol-v1";
  readonly protocolId: string;
  readonly implementationArtifacts: {
    readonly analyticModel: ArtifactIdentity;
    readonly focusedTest: ArtifactIdentity;
  };
  readonly state: {
    readonly protocol: "frozen-before-any-source-data-score";
    readonly sourceDataScoreProduced: false;
    readonly publicationAuthorized: false;
    readonly grantsValidationClaim: false;
  };
  readonly upstreamBindings: {
    readonly sourceOverlay: {
      readonly shelfFreeze: ArtifactIdentity;
      readonly sourceOverlay: ArtifactIdentity;
      readonly sourceAudits: ArtifactIdentity;
      readonly blockers: ArtifactIdentity;
      readonly report: ArtifactIdentity;
      readonly sourceDispositions: ArtifactIdentity;
      readonly exactCommonShelf: CommonShelf;
      readonly restrictionHandling: {
        readonly manufacturedComparatorOnly: readonly string[];
        readonly retainedAsSourceScoreBlocks: readonly string[];
      };
    };
    readonly measurementAdapters: {
      readonly identity: ArtifactIdentity;
      readonly exactSelectionIds: readonly string[];
      readonly requiredCommonMapping: {
        readonly adapterKind: string;
        readonly bindingKind: string;
        readonly relativeInterventionOrderSpan: {
          readonly status: string;
          readonly reasonCode: string;
        };
        readonly absoluteFreeFallScore: {
          readonly status: string;
          readonly reasonCode: string;
        };
        readonly transportInteractionEffect: {
          readonly status: string;
          readonly reasonCode: string;
        };
        readonly restrictions: readonly string[];
      };
      readonly thermalFamily: {
        readonly selectionIds: readonly string[];
        readonly knowledgeHypothesisIds: readonly string[];
      };
      readonly vaporFamily: {
        readonly selectionIds: readonly string[];
        readonly knowledgeHypothesisIds: readonly string[];
      };
    };
    readonly mvGate: {
      readonly protocol: ArtifactIdentity;
      readonly eligibilityModel: ArtifactIdentity;
      readonly preflight: ArtifactIdentity;
      readonly reviewState: string;
      readonly absoluteEligibility: string;
      readonly modelRelativeEligibility: string;
      readonly analyticReynoldsRole: string;
      readonly exactSd71Census: {
        readonly selectionCount: number;
        readonly heliumArgonMixtureCount: number;
        readonly heliumAtReducedPressureCount: number;
        readonly airCount: number;
        readonly absoluteEligibleCount: number;
      };
      readonly onlyPositiveUse: string;
      readonly requiredEffectHere: string;
    };
    readonly phase8b: {
      readonly successor: ArtifactIdentity;
      readonly plotMetadata: ArtifactIdentity;
    };
    readonly knowledgeBaseline: {
      readonly sourceRegister: ArtifactIdentity;
      readonly hypotheses: ArtifactIdentity;
      readonly requiredHypothesisIds: readonly string[];
    };
  };
  readonly sourceBindings: Record<string, {
    readonly sourceId: string;
    readonly logicalPath: string;
    readonly byteLength: number;
    readonly sha256: string;
    readonly role: string;
    readonly locator?: string;
    readonly locators?: readonly string[];
    readonly currencyLimit?: string;
  }>;
  readonly rule12Currency: {
    readonly status: string;
    readonly unresolved: readonly string[];
  };
  readonly analyticOperator: {
    readonly scope: string;
    readonly geometry: string;
    readonly ventilation: string;
    readonly conductivity: string;
    readonly temperature: string;
    readonly vaporResistance: string;
    readonly latentHeatResistance: string;
    readonly combinedTransfer: string;
    readonly separationRule: string;
    readonly oneFactorExpectation: {
      readonly lowerVaporDiffusivity: string;
      readonly lowerThermalConductivity: string;
      readonly simultaneousChange: string;
    };
  };
  readonly manufacturedControls: readonly string[];
  readonly printedLatentHeatingAnchors: {
    readonly anchors: readonly {
      readonly temperatureC: number;
      readonly chi0: number;
      readonly multiplier: number;
    }[];
    readonly refusals: readonly string[];
  };
  readonly sourceDataExecution: {
    readonly authorized: false;
    readonly rowsRead: 0;
    readonly scoresProduced: 0;
    readonly publicationArtifacts: 0;
    readonly unlockRequirements: readonly string[];
  };
  readonly claimBoundary: {
    readonly allowed: readonly string[];
    readonly forbidden: readonly string[];
  };
}

const ROOT = resolve(import.meta.dirname, "../..");
const protocol = JSON.parse(
  readFileSync(resolve(ROOT, "research/phase9-transport-analytic-protocol-v1.json"), "utf8"),
) as TransportProtocol;

const MANUFACTURED: Phase9TransportResistanceInput = {
  purpose: "manufactured-analytic-check",
  geometry: "shared-capacitance-spherical-bulk",
  ventilation: "not-represented-manufactured-only",
  temperatureK: 250,
  saturationVaporPressureIcePa: 100,
  vaporDiffusivityM2S: 2e-5,
  thermalConductivityWMK: 0.02,
  gasConstantJMolK: 8.3144521,
  waterMolarMassKgMol: 0.018,
  latentHeatSublimationJKg: 2_837_000,
};

const EXPECTED_STATE = {
  protocol: "frozen-before-any-source-data-score",
  sourceDataScoreProduced: false,
  publicationAuthorized: false,
  phase9Role: "development-only-manufactured-analytic-and-refusal-foundation",
  grantsValidationClaim: false,
} as const;

const EXPECTED_SOURCE_BINDINGS = {
  gondaKomabayasi1971: {
    sourceId: "P8B-S2R0-2EA39D1BD3D62F87101CF104",
    logicalPath:
      "research-cache/phase8b-search/acquired-sources-20260811-v1/gonda-1971-skeletal-dendritic.pdf",
    byteLength: 4_837_155,
    sha256: "2ea39d1bd3d62f87101cf1041c43225e9bb24e3b0be25fc61df3228a7499dfd8",
    role: "condition and uncrossed-design boundary only; no row is consumed",
  },
  harringtonSokolowskyMorrison2021: {
    sourceId: "P9K-HSM21",
    logicalPath:
      "research-cache/content/harrington-sokolowsky-morrison-2021-semianalytic-deposition.pdf",
    byteLength: 2_138_534,
    sha256: "18bff2fe4bbf27323d61a092db7bf36efa1e19424ea63ab098f193ffb325a1d8",
    role:
      "printed reduced vapor-plus-thermal resistance comparator used only in manufactured checks",
    locators: [
      "PDF pages 6-7 equations 2-4",
      "PDF pages 9-13 surface-supersaturation approximation and benchmark",
    ],
  },
  libbrechtMonographDraft: {
    sourceId: "P9K-LIB-MONOGRAPH",
    logicalPath: "research-cache/content/1910.06389v2.pdf",
    byteLength: 25_611_913,
    sha256: "f6cd58ab841f841bcc310d2f722459122f7850cda9681ae0c7d1877bf21ef471",
    role: "exact printed-anchor identity only; not an adopted numeric source input",
    locator: "PDF page 99",
    currencyLimit:
      "The published Princeton edition has not been compared, so every monograph-only numeric physical use remains blocked.",
  },
} as const;

const EXPECTED_ANALYTIC_OPERATOR = {
  scope: "manufactured-analytic-check only",
  geometry:
    "One shared-capacitance spherical bulk closure. No prism, plate, finite cylinder, facet, axis, aspect-ratio, support, or morphology mapping is implemented.",
  ventilation:
    "Not represented. A manufactured diagnostic cannot be transferred to free fall.",
  conductivity:
    "Thermal conductivity is an explicit positive caller operand. No gas/species/pressure/temperature mapping or default is inferred.",
  temperature:
    "Temperature is an explicit positive manufactured operand. It does not authorize a minus-seven or minus-fifteen Celsius source result.",
  vaporResistance: "R_v = R*T/(e_sat_ice*D_v*M_w)",
  latentHeatResistance: "R_h = [L_s/(k*T)]*[L_s*M_w/(R*T)-1]",
  combinedTransfer: "G = 1/(R_v + R_h)",
  separationRule:
    "Report R_v and R_h separately. A one-factor manufactured comparison may change D_v or k, never both; interactionEstimate is always null.",
  oneFactorExpectation: {
    lowerVaporDiffusivity: "raises R_v and lowers G while R_h remains bit-identical",
    lowerThermalConductivity: "raises R_h and lowers G while R_v remains bit-identical",
    simultaneousChange: "refused as UNCROSSED_DESIGN",
  },
} as const;

const EXPECTED_MANUFACTURED_CONTROLS = [
  "independently recompute R_v, R_h, their sum, reciprocal transfer, and resistance fractions",
  "halve D_v only and recover exactly doubled R_v with unchanged R_h and reduced G",
  "halve k only and recover exactly doubled R_h with unchanged R_v and reduced G",
  "refuse a simultaneous D_v and k change and emit no interaction estimate",
  "refuse geometry, ventilation, temperature, vapor-pressure, or thermodynamic-constant drift inside a one-factor comparison",
  "refuse every nonfinite, zero, underflowed, or overflowed derived resistance, sum, reciprocal, fraction, or ratio",
  "reject a runtime quantitative purpose outside the exact five-purpose registry",
  "mark every returned analytic result or refusal grantsValidationClaim false",
  "recover the two exact printed anchor multipliers and refuse minus-seven and minus-fifteen Celsius",
  "gate all five quantitative purposes for each of the exact ten SD71 records",
] as const;

const EXPECTED_SOURCE_DATA_EXECUTION = {
  authorized: false,
  rowsRead: 0,
  scoresProduced: 0,
  publicationArtifacts: 0,
  unlockRequirements: [
    "a new byte-bound consuming-arm record representing every ventilation-relevant protocol dimension",
    "M-V absolute or model-relative eligibility for the exact requested use",
    "exact source geometry, thermal conductivity, vapor diffusivity, gas, pressure, forcing, and temperature mapping",
    "a separately reviewed source-score protocol and publisher/verifier",
  ],
} as const;

const EXPECTED_CLAIM_BOUNDARY = {
  allowed: [
    "manufactured arithmetic for the printed scalar resistance sum",
    "separate vapor- and latent-heat-resistance monotonic checks",
    "identity checks for the two approximate printed heating anchors",
    "machine-enforced refusal of every current SD71 quantitative transport result",
  ],
  forbidden: [
    "any source-data model score or residual",
    "any axis-length, aspect-ratio, habit, facet, or morphology prediction",
    "any free-fall, still-air, ventilation-negligible, gas-transfer, or pressure-transfer claim",
    "any heat-vapor interaction estimate",
    "any minus-seven or minus-fifteen Celsius heating multiplier derived from anchor interpolation",
    "any parameter adoption or physical-source freeze from the unresolved monograph edition",
    "held-out, validation, Phase 6, or Phase 7 credit",
  ],
} as const;

const EXPECTED_RULE12_CURRENCY = {
  basis:
    "Reuse the exact S0B current-version, correction, supplement, native-data, and later-author-output audit; no new source search or NAS observation is performed by this protocol.",
  status: "sufficient-for-manufactured-arithmetic-and-refusal-only",
  unresolved: [
    "Keller-Hallett 1982 full controlled-velocity text is absent",
    "the published Princeton monograph edition is not compared",
    "the cloud-growth 2025 native dataset and scripts are absent",
    "bulk-aircraft later-author output remains unresolved for an affected arm freeze",
  ],
  effect:
    "No source-data score, physical parameter freeze, target-temperature multiplier, or promotion is eligible.",
} as const;

const EXPECTED_PRINTED_ANCHORS = {
  role: "non-consuming identity diagnostic only",
  relation: "diffusion-limited multiplier = 1/(1+chi0)",
  anchors: [
    { temperatureC: -1, chi0: 0.8, multiplier: 1 / 1.8 },
    { temperatureC: -10, chi0: 0.4, multiplier: 1 / 1.4 },
  ],
  refusals: [
    "No interpolation or extrapolation between or beyond the two anchors.",
    "No minus-seven or minus-fifteen Celsius multiplier without a byte-bound exact-condition geometry and conductivity calculation.",
    "No pressure scaling because the approximate proportionality supplies no exact reference-condition mapping here.",
    "No anchor is an adopted source input while the published-edition comparison remains unresolved.",
  ],
} as const;

const EXPECTED_MV_SEMANTICS = {
  reviewState: "independent-focused-review-no-blocker",
  absoluteEligibility: "blocked-no-byte-bound-consuming-arm-record",
  modelRelativeEligibility: "blocked-no-byte-bound-paired-record",
  analyticReynoldsRole: "diagnostic-only",
  exactSd71Census: {
    selectionCount: 10,
    heliumArgonMixtureCount: 6,
    heliumAtReducedPressureCount: 4,
    airCount: 0,
    absoluteEligibleCount: 0,
  },
  onlyPositiveUse:
    "exact source-reported order span with the non-air free-fall transport confound; it is not a quantitative M-PT or M-LH result",
  requiredEffectHere:
    "Every absolute, model-relative, axis-length, aspect-ratio, or interaction result for every exact SD71 selection remains source-blocked.",
} as const;

function strictRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`transport protocol semantic validator refused: ${label} is not an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void {
  if (!isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort())) {
    throw new Error(`transport protocol semantic validator refused: ${label} keys differ`);
  }
}

function requireExact(value: unknown, expected: unknown, label: string): void {
  if (!isDeepStrictEqual(value, expected)) {
    throw new Error(`transport protocol semantic validator refused: ${label} differs`);
  }
}

function validateFrozenTransportProtocol(value: unknown): void {
  const root = strictRecord(value, "protocol");
  requireExactKeys(root, [
    "schema",
    "protocolId",
    "frozenDate",
    "adoptionCommit",
    "state",
    "implementationArtifacts",
    "question",
    "upstreamBindings",
    "sourceBindings",
    "rule12Currency",
    "analyticOperator",
    "printedLatentHeatingAnchors",
    "manufacturedControls",
    "sourceDataExecution",
    "claimBoundary",
  ], "protocol");
  requireExact(root.schema, "phase9-transport-analytic-protocol-v1", "schema");
  requireExact(root.protocolId, "phase9-mpt-mlh-analytic-prescore-v1", "protocol ID");
  requireExact(root.frozenDate, "2026-08-13", "frozen date");
  requireExact(root.adoptionCommit, "f936920", "adoption commit");
  requireExact(
    root.question,
    "Which vapor-resistance and latent-heat-resistance calculations are honest before the free-fall protocol is quantitatively representable?",
    "question",
  );
  requireExact(root.state, EXPECTED_STATE, "state");

  const implementation = strictRecord(root.implementationArtifacts, "implementation artifacts");
  requireExactKeys(implementation, ["analyticModel", "focusedTest"], "implementation artifacts");
  for (const [name, expectedPath] of [
    ["analyticModel", "runner/src/phase9-transport-analytic.ts"],
    ["focusedTest", "runner/test/phase9-transport-analytic.test.ts"],
  ] as const) {
    const artifact = strictRecord(implementation[name], `${name} artifact`);
    requireExactKeys(artifact, ["path", "byteLength", "sha256"], `${name} artifact`);
    requireExact(artifact.path, expectedPath, `${name} path`);
    if (!Number.isSafeInteger(artifact.byteLength) || (artifact.byteLength as number) <= 0) {
      throw new Error(`transport protocol semantic validator refused: ${name} byte length differs`);
    }
    if (typeof artifact.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(artifact.sha256)) {
      throw new Error(`transport protocol semantic validator refused: ${name} hash differs`);
    }
  }

  const upstream = strictRecord(root.upstreamBindings, "upstream bindings");
  requireExactKeys(upstream, [
    "sourceOverlay",
    "measurementAdapters",
    "mvGate",
    "phase8b",
    "knowledgeBaseline",
  ], "upstream bindings");
  const mv = strictRecord(upstream.mvGate, "M-V gate");
  requireExactKeys(mv, [
    "protocol",
    "eligibilityModel",
    "preflight",
    "reviewState",
    "absoluteEligibility",
    "modelRelativeEligibility",
    "analyticReynoldsRole",
    "exactSd71Census",
    "onlyPositiveUse",
    "requiredEffectHere",
  ], "M-V gate");
  requireExact({
    reviewState: mv.reviewState,
    absoluteEligibility: mv.absoluteEligibility,
    modelRelativeEligibility: mv.modelRelativeEligibility,
    analyticReynoldsRole: mv.analyticReynoldsRole,
    exactSd71Census: mv.exactSd71Census,
    onlyPositiveUse: mv.onlyPositiveUse,
    requiredEffectHere: mv.requiredEffectHere,
  }, EXPECTED_MV_SEMANTICS, "M-V semantics");

  requireExact(root.sourceBindings, EXPECTED_SOURCE_BINDINGS, "source roles and locators");
  requireExact(root.rule12Currency, EXPECTED_RULE12_CURRENCY, "Rule 12 currency boundary");
  requireExact(root.analyticOperator, EXPECTED_ANALYTIC_OPERATOR, "analytic operator");
  requireExact(root.printedLatentHeatingAnchors, EXPECTED_PRINTED_ANCHORS, "printed anchors");
  requireExact(root.manufacturedControls, EXPECTED_MANUFACTURED_CONTROLS, "manufactured controls");
  requireExact(root.sourceDataExecution, EXPECTED_SOURCE_DATA_EXECUTION, "source-data execution");
  requireExact(root.claimBoundary, EXPECTED_CLAIM_BOUNDARY, "claim boundary");
}

function expectProtocolMutation(
  label: string,
  mutate: (candidate: Record<string, unknown>) => void,
): void {
  const candidate = structuredClone(protocol) as unknown as Record<string, unknown>;
  const before = JSON.stringify(candidate);
  mutate(candidate);
  expect(JSON.stringify(candidate), `${label} did not execute`).not.toBe(before);
  expect(() => validateFrozenTransportProtocol(candidate), label).toThrow(
    /transport protocol semantic validator refused/u,
  );
}

function bytes(identity: ArtifactIdentity): Uint8Array {
  return readFileSync(resolve(ROOT, identity.path));
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function expectIdentity(identity: ArtifactIdentity): void {
  const value = bytes(identity);
  expect(value.byteLength, identity.path).toBe(identity.byteLength);
  expect(sha256(value), identity.path).toBe(identity.sha256);
}

function jsonl(path: string): readonly Record<string, unknown>[] {
  const text = readFileSync(resolve(ROOT, path), "utf8");
  expect(text.endsWith("\n"), path).toBe(true);
  expect(text.includes("\r"), path).toBe(false);
  return text.slice(0, -1).split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("Phase 9 M-PT/M-LH analytic pre-score protocol", () => {
  it("is frozen before any source score or publication", () => {
    validateFrozenTransportProtocol(protocol);
    expect(protocol.schema).toBe("phase9-transport-analytic-protocol-v1");
    expect(protocol.protocolId).toBe(PHASE9_TRANSPORT_PROTOCOL_ID);
    expect(protocol.state).toEqual(EXPECTED_STATE);
    expect(protocol.sourceDataExecution).toEqual(EXPECTED_SOURCE_DATA_EXECUTION);
    expect(protocol.claimBoundary).toEqual(EXPECTED_CLAIM_BOUNDARY);
  });

  it("rejects executable drift in every newly load-bearing semantic boundary", () => {
    expectProtocolMutation("top-level extra key", (candidate) => {
      candidate.unrecognizedAuthorization = true;
    });
    expectProtocolMutation("vapor formula", (candidate) => {
      strictRecord(candidate.analyticOperator, "mutation").vaporResistance = "R_v = 0";
    });
    expectProtocolMutation("geometry", (candidate) => {
      strictRecord(candidate.analyticOperator, "mutation").geometry = "free-fall prism";
    });
    expectProtocolMutation("ventilation", (candidate) => {
      strictRecord(candidate.analyticOperator, "mutation").ventilation = "represented";
    });
    expectProtocolMutation("separation rule", (candidate) => {
      strictRecord(candidate.analyticOperator, "mutation").separationRule =
        "Change both axes and estimate an interaction.";
    });
    expectProtocolMutation("one-factor expectation", (candidate) => {
      const operator = strictRecord(candidate.analyticOperator, "mutation");
      strictRecord(operator.oneFactorExpectation, "mutation").simultaneousChange = "accepted";
    });
    expectProtocolMutation("manufactured control", (candidate) => {
      (candidate.manufacturedControls as unknown[]).pop();
    });
    expectProtocolMutation("unlock requirement", (candidate) => {
      strictRecord(candidate.sourceDataExecution, "mutation").unlockRequirements = [];
    });
    expectProtocolMutation("allowed claim", (candidate) => {
      const boundary = strictRecord(candidate.claimBoundary, "mutation");
      boundary.allowed = [
        ...(boundary.allowed as unknown[]),
        "quantitative validation from manufactured arithmetic",
      ];
    });
    expectProtocolMutation("forbidden claim", (candidate) => {
      const boundary = strictRecord(candidate.claimBoundary, "mutation");
      boundary.forbidden = (boundary.forbidden as unknown[]).slice(1);
    });
    expectProtocolMutation("source role", (candidate) => {
      const bindings = strictRecord(candidate.sourceBindings, "mutation");
      strictRecord(bindings.harringtonSokolowskyMorrison2021, "mutation").role =
        "experimental witness";
    });
    expectProtocolMutation("source locator", (candidate) => {
      const bindings = strictRecord(candidate.sourceBindings, "mutation");
      strictRecord(bindings.libbrechtMonographDraft, "mutation").locator = "PDF page 1";
    });
    expectProtocolMutation("M-V positive use", (candidate) => {
      const upstream = strictRecord(candidate.upstreamBindings, "mutation");
      strictRecord(upstream.mvGate, "mutation").onlyPositiveUse = "absolute score";
    });
    expectProtocolMutation("M-V required refusal", (candidate) => {
      const upstream = strictRecord(candidate.upstreamBindings, "mutation");
      strictRecord(upstream.mvGate, "mutation").requiredEffectHere = "promotion available";
    });
  });

  it("binds the final S0B, S1, M-V, Phase 8B, and knowledge bytes", () => {
    const identities = [
      protocol.implementationArtifacts.analyticModel,
      protocol.implementationArtifacts.focusedTest,
      protocol.upstreamBindings.sourceOverlay.shelfFreeze,
      protocol.upstreamBindings.sourceOverlay.sourceOverlay,
      protocol.upstreamBindings.sourceOverlay.sourceAudits,
      protocol.upstreamBindings.sourceOverlay.blockers,
      protocol.upstreamBindings.sourceOverlay.report,
      protocol.upstreamBindings.sourceOverlay.sourceDispositions,
      protocol.upstreamBindings.measurementAdapters.identity,
      protocol.upstreamBindings.mvGate.protocol,
      protocol.upstreamBindings.mvGate.eligibilityModel,
      protocol.upstreamBindings.mvGate.preflight,
      protocol.upstreamBindings.phase8b.successor,
      protocol.upstreamBindings.phase8b.plotMetadata,
      protocol.upstreamBindings.knowledgeBaseline.sourceRegister,
      protocol.upstreamBindings.knowledgeBaseline.hypotheses,
    ];
    for (const identity of identities) expectIdentity(identity);
  });

  it("matches both exact S0B shelf rows and partitions every restriction without erasing one", () => {
    const shelf = JSON.parse(
      readFileSync(resolve(ROOT, protocol.upstreamBindings.sourceOverlay.shelfFreeze.path), "utf8"),
    ) as { readonly shelf: readonly Record<string, unknown>[] };
    const common = protocol.upstreamBindings.sourceOverlay.exactCommonShelf;
    const { items, ...expectedCommon } = common;
    expect(items).toEqual(["M-PT", "M-LH"]);
    for (const item of items) {
      const row = shelf.shelf.find((candidate) => candidate.item === item);
      expect(row).toBeDefined();
      const { item: actualItem, ...actualCommon } = row as Record<string, unknown>;
      expect(actualItem).toBe(item);
      expect(actualCommon).toEqual(expectedCommon);
    }

    expect(common.protocolRestrictions).toHaveLength(15);
    const expectedIds = common.protocolRestrictions.map((entry) => entry.id).sort();
    expect(new Set(expectedIds).size).toBe(15);
    const handling = protocol.upstreamBindings.sourceOverlay.restrictionHandling;
    expect([...handling.manufacturedComparatorOnly, ...handling.retainedAsSourceScoreBlocks].sort())
      .toEqual(expectedIds);
    expect(handling.manufacturedComparatorOnly).toEqual([
      "P9R-18BFF2FE4BBF2732-EXTRACTION",
    ]);
  });

  it("binds the exact ten S1 records and their fail-closed uses", () => {
    const registration = protocol.upstreamBindings.measurementAdapters;
    expect(registration.exactSelectionIds).toEqual(PHASE9_TRANSPORT_SD71_SELECTION_IDS);
    const selected = jsonl(registration.identity.path).filter((row) =>
      registration.exactSelectionIds.includes(String(row.selectionId)),
    );
    expect(selected).toHaveLength(10);
    expect(selected.map((row) => row.selectionId)).toEqual(PHASE9_TRANSPORT_SD71_SELECTION_IDS);

    const expectedUses = [
      {
        purpose: "relative-intervention-order-span",
        reasonCode: registration.requiredCommonMapping.relativeInterventionOrderSpan.reasonCode,
        status: registration.requiredCommonMapping.relativeInterventionOrderSpan.status,
      },
      {
        purpose: "absolute-free-fall-score",
        reasonCode: registration.requiredCommonMapping.absoluteFreeFallScore.reasonCode,
        status: registration.requiredCommonMapping.absoluteFreeFallScore.status,
      },
      {
        purpose: "transport-interaction-effect",
        reasonCode: registration.requiredCommonMapping.transportInteractionEffect.reasonCode,
        status: registration.requiredCommonMapping.transportInteractionEffect.status,
      },
    ];
    const thermalIds = new Set(registration.thermalFamily.selectionIds);
    for (const row of selected) {
      expect(row.adapterKind).toBe(registration.requiredCommonMapping.adapterKind);
      expect(row.bindingKind).toBe(registration.requiredCommonMapping.bindingKind);
      expect(row.requestedUses).toEqual(expectedUses);
      expect(row.restrictions).toEqual(registration.requiredCommonMapping.restrictions);
      const thermal = thermalIds.has(String(row.selectionId));
      expect(row.knowledgeHypothesisIds).toEqual(
        thermal
          ? registration.thermalFamily.knowledgeHypothesisIds
          : registration.vaporFamily.knowledgeHypothesisIds,
      );
      expect(row.sourceConditionFields).toEqual(
        thermal
          ? [
              "conditions.carrierGas",
              "conditions.fixedReportedVaporDiffusivityCm2PerS",
              "conditions.growthMode",
              "conditions.humidityReference",
              "conditions.photoTimeAfterSeedingSeconds",
              "conditions.temperatureC",
            ]
          : [
              "conditions.carrierGas",
              "conditions.fixedThermalConductivityReported",
              "conditions.fixedThermalConductivityUnit",
              "conditions.growthMode",
              "conditions.humidityReference",
              "conditions.photoTimeAfterSeedingSeconds",
              "conditions.temperatureC",
            ],
      );
      expect(row.uncertaintyFields).toEqual([
        "sourceUncertainty.formalStatisticalUncertainty",
        "sourceUncertainty.sampleDenominator",
        "sourceUncertainty.verticalBarSemantics",
      ]);
    }
  });

  it("inherits the final M-V zero-absolute census and both quantitative refusals", () => {
    const mv = JSON.parse(
      readFileSync(resolve(ROOT, protocol.upstreamBindings.mvGate.protocol.path), "utf8"),
    ) as {
      readonly state: {
        readonly modelScoreProduced: boolean;
        readonly grantsValidationClaim: boolean;
      };
      readonly absoluteEligibility: {
        readonly state: string;
        readonly eligibleCount: number;
        readonly analyticReynoldsHelperRole: string;
      };
      readonly purposeRules: readonly { readonly purpose: string; readonly result: string }[];
      readonly sourceRelativeRegistry: readonly {
        readonly sourceRecordId: string;
        readonly ventilationConfoundLabel: string;
      }[];
      readonly sd71AbsoluteCensus: {
        readonly expectedSelectionIds: readonly string[];
        readonly expectedCarrierGasCounts: {
          readonly heliumArgonMixture: number;
          readonly heliumAtReducedPressure: number;
          readonly air: number;
        };
        readonly expectedAbsoluteEligibleCount: number;
      };
    };
    const gate = protocol.upstreamBindings.mvGate;
    expect(gate.reviewState).toBe("independent-focused-review-no-blocker");
    expect(mv.state).toEqual(expect.objectContaining({
      modelScoreProduced: false,
      grantsValidationClaim: false,
    }));
    expect(mv.absoluteEligibility).toEqual(expect.objectContaining({
      state: gate.absoluteEligibility,
      eligibleCount: 0,
      analyticReynoldsHelperRole: gate.analyticReynoldsRole,
    }));
    expect(mv.purposeRules).toEqual(expect.arrayContaining([
      expect.objectContaining({
        purpose: "absolute-score-under-low-re-approximation",
        result: "ineligible",
      }),
      expect.objectContaining({
        purpose: "relative-intervention-direction",
        result: "ineligible",
      }),
      expect.objectContaining({
        purpose: "source-reported-relative-order-span",
        result: "eligible-with-limitation",
      }),
    ]));
    expect(mv.sourceRelativeRegistry.map((entry) => entry.sourceRecordId))
      .toEqual(PHASE9_TRANSPORT_SD71_SELECTION_IDS);
    expect(new Set(mv.sourceRelativeRegistry.map((entry) => entry.ventilationConfoundLabel)))
      .toEqual(new Set(["non-air-free-fall-transport-confounded"]));
    expect(mv.sd71AbsoluteCensus).toEqual({
      expectedSelectionIds: [...PHASE9_TRANSPORT_SD71_SELECTION_IDS],
      expectedCarrierGasCounts: {
        heliumArgonMixture: gate.exactSd71Census.heliumArgonMixtureCount,
        heliumAtReducedPressure: gate.exactSd71Census.heliumAtReducedPressureCount,
        air: gate.exactSd71Census.airCount,
      },
      expectedAbsoluteEligibleCount: gate.exactSd71Census.absoluteEligibleCount,
      reason: "all-non-air-no-maximum-Re-and-no-complete-protocol-record",
    });
  });

  it("binds the three source identities without reading NAS bytes", () => {
    const overlay = jsonl(protocol.upstreamBindings.sourceOverlay.sourceOverlay.path);
    const sourceRegister = jsonl(protocol.upstreamBindings.knowledgeBaseline.sourceRegister.path);
    for (const binding of Object.values(protocol.sourceBindings)) {
      const overlayRow = overlay.find((row) => row.sha256 === binding.sha256) as {
        readonly canonicalPath?: unknown;
        readonly byteLength?: unknown;
        readonly aliases?: readonly { readonly sourceId?: unknown }[];
      } | undefined;
      expect(overlayRow, binding.sourceId).toBeDefined();
      expect(overlayRow?.canonicalPath).toBe(binding.logicalPath);
      expect(overlayRow?.byteLength).toBe(binding.byteLength);
      expect(overlayRow?.aliases?.some((alias) => alias.sourceId === binding.sourceId)).toBe(true);
    }
    const knowledgeIds = sourceRegister.map((row) => row.sourceId);
    expect(knowledgeIds).toEqual(expect.arrayContaining(["P9K-HSM21", "P9K-LIB-MONOGRAPH"]));
  });

  it("reuses S0B Rule 12 limits instead of claiming source currency closure", () => {
    expect(protocol.rule12Currency.status).toBe(
      "sufficient-for-manufactured-arithmetic-and-refusal-only",
    );
    expect(protocol.rule12Currency.unresolved).toEqual(expect.arrayContaining([
      expect.stringContaining("Keller-Hallett"),
      expect.stringContaining("Princeton"),
      expect.stringContaining("native dataset"),
      expect.stringContaining("later-author output"),
    ]));
  });
});

describe("Phase 9 M-PT/M-LH manufactured analytic model", () => {
  it("independently recomputes the printed vapor and latent-heat resistance terms", () => {
    const result = phase9TransportResistanceBreakdown(MANUFACTURED);
    const expectedVapor =
      (MANUFACTURED.gasConstantJMolK * MANUFACTURED.temperatureK) /
      (MANUFACTURED.saturationVaporPressureIcePa *
        MANUFACTURED.vaporDiffusivityM2S *
        MANUFACTURED.waterMolarMassKgMol);
    const expectedThermal =
      (MANUFACTURED.latentHeatSublimationJKg /
        (MANUFACTURED.thermalConductivityWMK * MANUFACTURED.temperatureK)) *
      ((MANUFACTURED.latentHeatSublimationJKg *
        MANUFACTURED.waterMolarMassKgMol) /
        (MANUFACTURED.gasConstantJMolK * MANUFACTURED.temperatureK) -
        1);
    expect(result.vaporResistanceSMPerKg).toBeCloseTo(expectedVapor, 12);
    expect(result.latentHeatResistanceSMPerKg).toBeCloseTo(expectedThermal, 12);
    expect(result.totalResistanceSMPerKg).toBeCloseTo(expectedVapor + expectedThermal, 12);
    expect(result.bulkTransferCoefficientKgM1S1).toBeCloseTo(
      1 / (expectedVapor + expectedThermal),
      20,
    );
    expect(
      result.vaporFractionOfTotalResistance +
        result.latentHeatFractionOfTotalResistance,
    ).toBeCloseTo(1, 15);
    expect(result).toEqual(expect.objectContaining({
      status: "manufactured-diagnostic-only",
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    }));
  });

  it("halves vapor diffusivity as one factor and leaves latent-heat resistance exact", () => {
    const result = phase9TransportOneFactorManufacturedComparison(MANUFACTURED, {
      ...MANUFACTURED,
      vaporDiffusivityM2S: MANUFACTURED.vaporDiffusivityM2S / 2,
    });
    expect(result.status).toBe("manufactured-diagnostic-only");
    if (result.status !== "manufactured-diagnostic-only") throw new Error("unexpected refusal");
    expect(result.axis).toBe("vapor-diffusivity");
    expect(result.vaporResistanceRatio).toBeCloseTo(2, 15);
    expect(result.latentHeatResistanceRatio).toBe(1);
    expect(result.bulkTransferCoefficientRatio).toBeLessThan(1);
    expect(result.interactionEstimate).toBeNull();
    expect(result.grantsValidationClaim).toBe(false);
  });

  it("halves thermal conductivity as one factor and leaves vapor resistance exact", () => {
    const result = phase9TransportOneFactorManufacturedComparison(MANUFACTURED, {
      ...MANUFACTURED,
      thermalConductivityWMK: MANUFACTURED.thermalConductivityWMK / 2,
    });
    expect(result.status).toBe("manufactured-diagnostic-only");
    if (result.status !== "manufactured-diagnostic-only") throw new Error("unexpected refusal");
    expect(result.axis).toBe("thermal-conductivity");
    expect(result.vaporResistanceRatio).toBe(1);
    expect(result.latentHeatResistanceRatio).toBeCloseTo(2, 15);
    expect(result.bulkTransferCoefficientRatio).toBeLessThan(1);
    expect(result.interactionEstimate).toBeNull();
    expect(result.grantsValidationClaim).toBe(false);
  });

  it("refuses a two-axis change rather than inferring an uncrossed interaction", () => {
    const result = phase9TransportOneFactorManufacturedComparison(MANUFACTURED, {
      ...MANUFACTURED,
      vaporDiffusivityM2S: MANUFACTURED.vaporDiffusivityM2S / 2,
      thermalConductivityWMK: MANUFACTURED.thermalConductivityWMK / 2,
    });
    expect(result).toEqual(expect.objectContaining({
      status: "refused",
      reasonCode: "UNCROSSED_DESIGN",
      interactionEstimate: null,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    }));
  });

  it("refuses a no-op and non-intervention condition drift", () => {
    expect(phase9TransportOneFactorManufacturedComparison(MANUFACTURED, MANUFACTURED))
      .toEqual(expect.objectContaining({
        status: "refused",
        reasonCode: "NO_INTERVENTION",
        grantsValidationClaim: false,
      }));
    expect(phase9TransportOneFactorManufacturedComparison(MANUFACTURED, {
      ...MANUFACTURED,
      temperatureK: 251,
      vaporDiffusivityM2S: MANUFACTURED.vaporDiffusivityM2S / 2,
    })).toEqual(expect.objectContaining({
      status: "refused",
      reasonCode: "NON_INTERVENTION_CONDITION_CHANGED",
      grantsValidationClaim: false,
    }));
  });

  it("rejects unsupported geometry, represented ventilation, and nonphysical operands", () => {
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      geometry: "finite-prism" as Phase9TransportResistanceInput["geometry"],
    })).toThrow(/geometry/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      ventilation: "free-fall" as Phase9TransportResistanceInput["ventilation"],
    })).toThrow(/ventilation/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      thermalConductivityWMK: 0,
    })).toThrow(/thermal conductivity/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      latentHeatSublimationJKg: 1,
    })).toThrow(/thermal resistance nonpositive/u);
  });

  it("fails closed on nonfinite, underflowed, overflowed, and unresolved derived arithmetic", () => {
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      temperatureK: Number.NaN,
    })).toThrow(/temperature must be finite/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      temperatureK: Number.MIN_VALUE,
    })).toThrow(/latent-heat resistance must remain finite and positive/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      saturationVaporPressureIcePa: Number.MAX_VALUE,
      vaporDiffusivityM2S: Number.MAX_VALUE,
    })).toThrow(/vapor resistance must remain finite and positive/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      saturationVaporPressureIcePa: 5.77e-299,
      thermalConductivityWMK: 2.674e-303,
    })).toThrow(/total transport resistance must remain finite and positive/u);
    expect(() => phase9TransportResistanceBreakdown({
      ...MANUFACTURED,
      saturationVaporPressureIcePa: 1e-298,
    })).toThrow(/fraction of total resistance/u);
  });

  it("recovers only the two printed heating-anchor identities", () => {
    expect(phase9LatentHeatingPrintedAnchor(-1)).toEqual({
      status: "printed-anchor-identity-only",
      temperatureC: -1,
      chi0: 0.8,
      diffusionLimitedMultiplier: 1 / 1.8,
      sourceInputEligible: false,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    });
    expect(phase9LatentHeatingPrintedAnchor(-10)).toEqual({
      status: "printed-anchor-identity-only",
      temperatureC: -10,
      chi0: 0.4,
      diffusionLimitedMultiplier: 1 / 1.4,
      sourceInputEligible: false,
      sourceDataScoreProduced: false,
      grantsValidationClaim: false,
    });
    expect(protocol.printedLatentHeatingAnchors.anchors).toEqual([
      { temperatureC: -1, chi0: 0.8, multiplier: 1 / 1.8 },
      { temperatureC: -10, chi0: 0.4, multiplier: 1 / 1.4 },
    ]);
  });

  it("refuses target temperatures, interpolation, extrapolation, and implicit pressure scaling", () => {
    for (const temperatureC of [-7, -15]) {
      expect(phase9LatentHeatingPrintedAnchor(temperatureC)).toEqual(expect.objectContaining({
        status: "refused",
        temperatureC,
        reasonCode: "TARGET_CONDITION_RESISTANCE_REQUIRED",
        sourceInputEligible: false,
        grantsValidationClaim: false,
      }));
    }
    for (const temperatureC of [-5, -20, 0]) {
      expect(phase9LatentHeatingPrintedAnchor(temperatureC)).toEqual(expect.objectContaining({
        status: "refused",
        temperatureC,
        reasonCode: "ANCHOR_INTERPOLATION_OR_EXTRAPOLATION_FORBIDDEN",
        grantsValidationClaim: false,
      }));
    }
    expect(protocol.printedLatentHeatingAnchors.refusals.join(" ")).toMatch(/pressure scaling/u);
  });

  it("gates every quantitative purpose for every exact SD71 record", () => {
    const purposes: readonly Phase9TransportQuantitativePurpose[] = [
      "absolute-free-fall-score",
      "model-relative-free-fall-score",
      "axis-length-prediction",
      "aspect-ratio-prediction",
      "transport-interaction-effect",
    ];
    expect(PHASE9_TRANSPORT_QUANTITATIVE_PURPOSES).toEqual(purposes);
    for (const sourceRecordId of PHASE9_TRANSPORT_SD71_SELECTION_IDS) {
      for (const requestedPurpose of purposes) {
        expect(phase9TransportSd71QuantitativeGate(sourceRecordId, requestedPurpose)).toEqual({
          status: "source-blocked",
          reasonCode: "MV_BLOCKS_SD71_QUANTITATIVE_RESULT",
          sourceRecordId,
          requestedPurpose,
          absoluteEligibility: false,
          modelRelativeEligibility: false,
          sourceRelativeOrderSpanRemainsAvailableOnlyThroughMv: true,
          ventilationConfound: "non-air-free-fall-transport-confounded",
          sourceDataScoreProduced: false,
          grantsValidationClaim: false,
        });
      }
    }
  });

  it("does not turn an unknown record into a transport capability", () => {
    expect(phase9TransportSd71QuantitativeGate(
      "P8B-P1-SD71-FORGED",
      "absolute-free-fall-score",
    )).toEqual(expect.objectContaining({
      status: "ineligible",
      reasonCode: "SOURCE_RECORD_OUTSIDE_CLOSED_SD71_REGISTRY",
      sourceRelativeOrderSpanRemainsAvailableOnlyThroughMv: false,
      absoluteEligibility: false,
      modelRelativeEligibility: false,
    }));
  });

  it("rejects a runtime quantitative purpose outside the closed five-purpose registry", () => {
    expect(() => phase9TransportSd71QuantitativeGate(
      "P8B-P1-SD71-M11",
      "forged-purpose" as Phase9TransportQuantitativePurpose,
    )).toThrow(/purpose is outside the closed registry/u);
  });
});
