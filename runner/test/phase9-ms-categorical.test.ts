import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PHASE9_MS_BACON_SHA256,
  PHASE9_MS_CATEGORY_CODEBOOK,
  PHASE9_MS_CLAIM_BOUNDARY,
  PHASE9_MS_PROTOCOL_ID,
  PHASE9_MS_REGISTRY_BYTE_LENGTH,
  PHASE9_MS_REGISTRY_SHA256,
  PHASE9_MS_SATO_SHA256,
  phase9MsEvaluateBaconAggregate,
  phase9MsEvaluateSato,
  phase9MsTwoByTwoNullModelDiagnostic,
  phase9MsValidateRegistrySnapshot,
  type Phase9MsBaconPurpose,
  type Phase9MsBaconSelectionId,
  type Phase9MsSatoPurpose,
} from "../src/phase9-ms-categorical.ts";

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

type JsonRecord = Record<string, unknown>;

const root = resolve(import.meta.dirname, "../..");
const registryPath = resolve(root, "research/phase9-ms-categorical-registry-v1.jsonl");
const protocolPath = resolve(root, "research/phase9-ms-protocol-v1.json");
const registryBytes = readFileSync(registryPath);

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

function liveIdentity(path: string): ArtifactIdentity {
  const bytes = readFileSync(resolve(root, path));
  return { path, byteLength: bytes.byteLength, sha256: sha256(bytes) };
}

const EXACT_OVERLAY_IDENTITIES = {
  shelfFreeze: {
    path: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
    byteLength: 63_975,
    sha256: "b0bbab2e01eca61dfb2b807bda3614aaf803e5fd0457f2df02aa3e4b8c5d1a06",
  },
  sourceOverlay: {
    path: "evidence/phase9-source-overlay-v1/source-overlay.jsonl",
    byteLength: 114_408,
    sha256: "f79cfd5268524d9017439e7be3abfe8b1e5df13f4e909c5d62569b8cc59ed5f7",
  },
  sourceAudits: {
    path: "evidence/phase9-source-overlay-v1/source-audits.jsonl",
    byteLength: 44_355,
    sha256: "3255e66e29aca0f33e4fd8490f7c647ddc796a71206e764932fd2fe1d51d753a",
  },
  report: {
    path: "evidence/phase9-source-overlay-v1/report.json",
    byteLength: 6_530,
    sha256: "51e1fa2bf6a84beb94ffd442fd0d55df9017f7bb76e2b04d1e1f5fec38c63d8a",
  },
  sourceDispositions: {
    path: "research/phase9-source-dispositions-v1.jsonl",
    byteLength: 86_719,
    sha256: "598f75c28490ac6d50e1c4d1be443905f62f755caa1119757688cb71f492af21",
  },
  satoCorrection: {
    path: "research/phase9-sato-source-correction.md",
    byteLength: 1_811,
    sha256: "84364d678c835e7dbc23bec15ed96c433ce4a6aa767a29f7f4906e20b3d8f1ae",
  },
} as const;

const EXACT_BACON_IDENTITIES = {
  artifactIndex: {
    path: "evidence/phase8b-bacon-seed-history-v1/artifact-index.json",
    byteLength: 402,
    sha256: "2cf6cdc81de5eb6a22e6d3ccab19f7d7317a68e903205435ee84531e829704a7",
  },
  records: {
    path: "evidence/phase8b-bacon-seed-history-v1/records.jsonl",
    byteLength: 6_199,
    sha256: "680ee6fc8f1459f2087988cc94f840a47f8be7a04b4d0381fc300721a5c62c2f",
  },
  report: {
    path: "evidence/phase8b-bacon-seed-history-v1/report.json",
    byteLength: 3_107,
    sha256: "73ca145532ce23373b2e7087d6023d0fc72ac269f25504c2b75bc17c1ecc0792",
  },
  researchExtract: {
    path: "research/bacon-baker-swanson-2003.md",
    byteLength: 29_658,
    sha256: "2e2b217dfb5de853209299507d9c520e9c2015e1d9b3f56dd7efac78a0ff21c1",
  },
  successorTargetBook: {
    path: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
    byteLength: 36_094,
    sha256: "c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3",
  },
} as const;

const EXACT_GENERIC_ADAPTER_IDENTITIES = {
  registry: {
    path: "research/phase9-adapter-registry-v1.jsonl",
    byteLength: 48_946,
    sha256: "498e85471766294d812b3ef9d747381e92eb476e8a9b40a3f34f855b53e46337",
  },
  implementation: {
    path: "runner/src/phase9-measurement-adapters.ts",
    byteLength: 64_710,
    sha256: "f3298052fdac1fac062fe789fc45fea7c886dfcf3c27bc0ba9166335a7f47f9b",
  },
} as const;

function object(value: unknown, label: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
}

function exact(value: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(value) !== JSON.stringify(expected)) {
    throw new Error(`${label} mismatch`);
  }
}

function exactKeys(value: JsonRecord, expected: readonly string[], label: string): void {
  exact(Object.keys(value).sort(), [...expected].sort(), `${label} keys`);
}

function validIdentity(value: unknown, label: string): ArtifactIdentity {
  const identity = object(value, label);
  exactKeys(identity, ["path", "byteLength", "sha256"], label);
  if (typeof identity.path !== "string" || identity.path.length === 0) {
    throw new Error(`${label}.path invalid`);
  }
  if (!Number.isSafeInteger(identity.byteLength) || (identity.byteLength as number) <= 0) {
    throw new Error(`${label}.byteLength invalid`);
  }
  if (typeof identity.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(identity.sha256)) {
    throw new Error(`${label}.sha256 invalid`);
  }
  return identity as unknown as ArtifactIdentity;
}

function rehash(identity: ArtifactIdentity): void {
  const bytes = readFileSync(resolve(root, identity.path));
  if (bytes.byteLength !== identity.byteLength || sha256(bytes) !== identity.sha256) {
    throw new Error(`artifact identity mismatch: ${identity.path}`);
  }
}

function exactBoundIdentity(
  value: unknown,
  expected: ArtifactIdentity,
  label: string,
  verifyFiles: boolean,
): void {
  validIdentity(value, label);
  exact(value, expected, label);
  if (verifyFiles) rehash(expected);
}

const EXPECTED_MS_SHELF = {
  blockerIdentities: [],
  completeArtifactCount: 4,
  completeArtifactSha256: [
    PHASE9_MS_SATO_SHA256,
    "977fcc882ab454f18e288fb5e7ef95cabba44ae59344c63eb74d45417a1e7121",
    "e382edbc61e706c4cdb88811bba2488f7d29baf8dd14d94b21e4a12f5d3fbbeb",
    PHASE9_MS_BACON_SHA256,
  ],
  item: "M-S",
  protocolDispositionRequired: true,
  protocolDispositionState: "pending",
  protocolRestrictions: [
    {
      artifactSha256: PHASE9_MS_SATO_SHA256,
      id: "P9R-3B2003581D94E04C-EXTRACTION",
      kind: "extraction",
      text: "Use a predeclared categorical intervention codebook with denominators from the printed contrasts.",
    },
    {
      artifactSha256: "977fcc882ab454f18e288fb5e7ef95cabba44ae59344c63eb74d45417a1e7121",
      id: "P9R-977FCC882AB454F1-EXTRACTION",
      kind: "extraction",
      text: "Do not count derivative classification rows as a second Bacon witness.",
    },
    {
      artifactSha256: "e382edbc61e706c4cdb88811bba2488f7d29baf8dd14d94b21e4a12f5d3fbbeb",
      id: "P9R-E382EDBC61E706C4-EXTRACTION",
      kind: "extraction",
      text: "Predeclare a morphology-atlas codebook before any panel score.",
    },
    {
      artifactSha256: PHASE9_MS_BACON_SHA256,
      id: "P9R-F312A5A18889320C-EXTRACTION",
      kind: "extraction",
      text: "Use only the reported aggregates and retain the missing-denominator refusal.",
    },
  ],
  sourceBlocked: false,
  sourceBlockerIds: [],
  sourceBlockerPresent: false,
  sourceBlockerStatuses: [],
};

const EXPECTED_PAGE_AUDIT = {
  method: "pdf-skill-poppler-render-and-personal-visual-inspection",
  requiredLoadBearingPages: [6, 7, 15, 16, 17, 18],
  categoryLegendPages: [8, 9, 10],
  locators: [
    "pdf-page:6;competitive-vapor-depletion;Figure-2",
    "pdf-page:7;supersaturation-decrease;crystal-spacing-limit",
    "pdf-page:15;Figure-14;temperature-exposure-history",
    "pdf-page:16;Figure-15;initial-N-42;preactivation-N-36",
    "pdf-page:17;Figure-16;small-N0-112-N-89;large-N0-49-N-48",
    "pdf-page:18;Figure-17;frozen-droplet-N-20;peculiar-shape-35-percent",
  ],
  limits:
    "Inspected the load-bearing pages and legend pages, not every page; no plotted bar height was converted into an unprinted count.",
};

const EXPECTED_DIAGNOSTICS = [
  {
    purpose: "preactivation-reported-directions",
    output: "printed directions and denominators only",
  },
  {
    purpose: "microcline-morphology-reported-directions",
    output: "printed directions and denominators only",
  },
  {
    purpose: "microcline-nucleation-proportion-contrast",
    output: "89/112 versus 48/49 plus descriptive two-by-two null diagnostic",
  },
  {
    purpose: "frozen-droplet-peculiar-proportion",
    output: "printed 35 percent at N=20, exactly derived as 7/20",
  },
];

const EXPECTED_BACON_REFUSAL = {
  selectionIds: [
    "P8B-P1-BACON-INITIATION-ASPECT",
    "P8B-P1-BACON-MASS-GROWTH-CONTRAST",
  ],
  allowedQuotation: "reported aggregate range or direction with limitations",
  computedFrequency: "refused",
  computedEffectSize: "refused",
  reasonCodes: [
    "MISSING_DENOMINATOR_AND_EXPOSURE_CONFOUND",
    "NO_DENOMINATOR_NO_INDIVIDUAL_ROWS",
  ],
};

const EXPECTED_CONFOUNDS = [
  "competitive vapor depletion varies with crystal spacing and time",
  "preactivation includes prior growth, evaporation, and hold history",
  "initial and preactivation exposure and supersaturation differ",
  "microcline size groups have different initial size distributions and unmatched exposure",
  "frozen droplets are not a matched mineral-substance control",
  "Bacon reports unmatched seed and frozen-droplet histories without ensemble denominators",
];

const EXPECTED_CLAIM_BOUNDARY = {
  phase9Role: "pre-score-descriptive-development-only",
  sourceDataScoreProduced: false,
  causalEffectEstimated: false,
  matchedExposureClaimAvailable: false,
  physicalPromotionEligible: false,
  grantsValidationClaim: false,
  publicationAuthorized: false,
  prohibited: [
    "invented individual rows or unprinted category counts",
    "causal seed-state or nucleant-size effect",
    "matched-exposure claim",
    "population effect size",
    "model score, validation, or physical promotion",
  ],
};

function validateProtocol(value: unknown, verifyFiles: boolean): void {
  const protocol = object(value, "protocol");
  exactKeys(
    protocol,
    [
      "schema",
      "protocolId",
      "frozenDate",
      "state",
      "implementationArtifacts",
      "upstreamBindings",
      "pageAudit",
      "registryPolicy",
      "authorizedDiagnostics",
      "baconMissingDenominatorRefusal",
      "confounds",
      "claimBoundary",
      "negativeControls",
    ],
    "protocol",
  );
  if (protocol.schema !== "phase9-ms-prescore-protocol-v1" || protocol.protocolId !== PHASE9_MS_PROTOCOL_ID) {
    throw new Error("protocol identity mismatch");
  }
  if (protocol.frozenDate !== "2026-08-13") throw new Error("frozen date mismatch");
  exact(
    protocol.state,
    {
      protocol: "frozen-before-any-M-S-model-score-or-publication",
      descriptiveSourceDiagnosticsAuthorized: true,
      measurementScoresProduced: 0,
      causalEffectsEstimated: 0,
      publicationAuthorized: false,
      physicalPromotionAuthorized: false,
      grantsValidationClaim: false,
    },
    "state",
  );
  const artifacts = object(protocol.implementationArtifacts, "implementationArtifacts");
  exactKeys(artifacts, ["categoricalRegistry", "pureEvaluator", "focusedTest"], "implementationArtifacts");
  const exactImplementationIdentities = {
    categoricalRegistry: liveIdentity("research/phase9-ms-categorical-registry-v1.jsonl"),
    pureEvaluator: liveIdentity("runner/src/phase9-ms-categorical.ts"),
    focusedTest: liveIdentity("runner/test/phase9-ms-categorical.test.ts"),
  };
  for (const name of ["categoricalRegistry", "pureEvaluator", "focusedTest"] as const) {
    exactBoundIdentity(
      artifacts[name],
      exactImplementationIdentities[name],
      `implementationArtifacts.${name}`,
      verifyFiles,
    );
  }
  const bindings = object(protocol.upstreamBindings, "upstreamBindings");
  exactKeys(bindings, ["sourceOverlay", "sourcePdfs", "baconRecords", "genericCategoricalAdapter"], "upstreamBindings");
  const overlay = object(bindings.sourceOverlay, "sourceOverlay");
  exactKeys(
    overlay,
    ["shelfFreeze", "sourceOverlay", "sourceAudits", "report", "sourceDispositions", "satoCorrection", "exactMsShelf"],
    "sourceOverlay",
  );
  exact(overlay.exactMsShelf, EXPECTED_MS_SHELF, "exact M-S shelf");
  for (const key of ["shelfFreeze", "sourceOverlay", "sourceAudits", "report", "sourceDispositions", "satoCorrection"] as const) {
    exactBoundIdentity(
      overlay[key],
      EXACT_OVERLAY_IDENTITIES[key],
      `sourceOverlay.${key}`,
      verifyFiles,
    );
  }
  exact(
    bindings.sourcePdfs,
    {
      sato: {
        shareRelativePath: "research-cache/phase8b-search/targeted-sources-20260812-v1/sato-kikuchi-1988-nucleation.pdf",
        byteLength: 1_656_110,
        sha256: PHASE9_MS_SATO_SHA256,
      },
      bacon: {
        shareRelativePath: "research-cache/content/bacon-baker-swanson-2003.pdf",
        byteLength: 1_270_112,
        sha256: PHASE9_MS_BACON_SHA256,
      },
      runtimeReadsNas: false,
    },
    "source PDF identities",
  );
  const baconRecords = object(bindings.baconRecords, "baconRecords");
  exactKeys(
    baconRecords,
    ["artifactIndex", "records", "report", "researchExtract", "successorTargetBook", "selectionIds"],
    "baconRecords",
  );
  exact(baconRecords.selectionIds, EXPECTED_BACON_REFUSAL.selectionIds, "Bacon selection IDs");
  for (const key of ["artifactIndex", "records", "report", "researchExtract", "successorTargetBook"] as const) {
    exactBoundIdentity(
      baconRecords[key],
      EXACT_BACON_IDENTITIES[key],
      `baconRecords.${key}`,
      verifyFiles,
    );
  }
  const genericAdapter = object(bindings.genericCategoricalAdapter, "genericCategoricalAdapter");
  exactKeys(genericAdapter, ["registry", "implementation", "binding"], "genericCategoricalAdapter");
  exact(
    genericAdapter.binding,
    {
      adapterKind: "initiation-aggregate",
      postPhase8CategoricalParser: "phase9-categorical-intervention-row-v1",
      limitation: "generic parser alone grants no score; this protocol authorizes only the named descriptive diagnostics",
    },
    "generic categorical binding",
  );
  for (const key of ["registry", "implementation"] as const) {
    exactBoundIdentity(
      genericAdapter[key],
      EXACT_GENERIC_ADAPTER_IDENTITIES[key],
      `genericCategoricalAdapter.${key}`,
      verifyFiles,
    );
  }
  exact(protocol.pageAudit, EXPECTED_PAGE_AUDIT, "page audit");
  exact(
    protocol.registryPolicy,
    {
      schema: "phase9-ms-categorical-registry-v1",
      recordIds: ["SK88-PREACTIVATION", "SK88-MICROCLINE-SIZE", "SK88-FROZEN-DROPLET"],
      categories: PHASE9_MS_CATEGORY_CODEBOOK,
      unprintedBarCounts: "null-and-not-estimated",
      denominatorPolicy: "only printed denominators; 7/20 is exact arithmetic from printed 35 percent and N=20",
    },
    "registry policy",
  );
  exact(protocol.authorizedDiagnostics, EXPECTED_DIAGNOSTICS, "authorized diagnostics");
  exact(protocol.baconMissingDenominatorRefusal, EXPECTED_BACON_REFUSAL, "Bacon refusal");
  exact(protocol.confounds, EXPECTED_CONFOUNDS, "confounds");
  exact(protocol.claimBoundary, EXPECTED_CLAIM_BOUNDARY, "claim boundary");
  exact(
    protocol.negativeControls,
    [
      "registry-byte-or-hash-mismatch",
      "registry-roster-or-schema-mismatch",
      "unknown-Sato-purpose",
      "unknown-Bacon-selection",
      "unknown-Bacon-purpose",
      "unsafe-or-overflowing-contingency-count",
      "zero-row-or-zero-column-contingency-table",
      "protocol-semantic-mutation-suite",
    ],
    "negative controls",
  );
}

function parseAndValidateRegistry(): readonly JsonRecord[] {
  expect(registryBytes.byteLength).toBe(PHASE9_MS_REGISTRY_BYTE_LENGTH);
  expect(sha256(registryBytes)).toBe(PHASE9_MS_REGISTRY_SHA256);
  const text = registryBytes.toString("utf8");
  expect(text.endsWith("\n")).toBe(true);
  expect(text.includes("\r")).toBe(false);
  const rows = text.trimEnd().split("\n").map((line) => object(JSON.parse(line), "registry row"));
  expect(rows).toHaveLength(3);
  expect(rows.map((row) => row.recordId)).toEqual([
    "SK88-PREACTIVATION",
    "SK88-MICROCLINE-SIZE",
    "SK88-FROZEN-DROPLET",
  ]);
  for (const row of rows) {
    expect(row.schema).toBe("phase9-ms-categorical-registry-v1");
    expect(row.categories).toEqual(PHASE9_MS_CATEGORY_CODEBOOK);
    expect(row.sourceIdentity).toEqual({
      byteLength: 1_656_110,
      sha256: PHASE9_MS_SATO_SHA256,
      shareRelativePath:
        "research-cache/phase8b-search/targeted-sources-20260812-v1/sato-kikuchi-1988-nucleation.pdf",
    });
  }
  expect(rows[0]!.groups).toEqual([
    { categoryCounts: null, denominator: 42, denominatorKind: "initial-grown-crystals", groupId: "initial" },
    { categoryCounts: null, denominator: 36, denominatorKind: "preactivation-grown-crystals", groupId: "preactivation" },
  ]);
  expect(rows[0]!.reportedDirections).toEqual([
    { category: "column", greaterGroup: "preactivation", lesserGroup: "initial" },
    { category: "peculiar-shape", greaterGroup: "initial", lesserGroup: "preactivation" },
  ]);
  expect(rows[1]!.groups).toEqual([
    { categoryCounts: null, crystalCount: 89, groupId: "small-microcline", modeDiameterUm: 20, nucleantDenominator: 112, sizeRangeUm: [10, 60] },
    { categoryCounts: null, crystalCount: 48, groupId: "large-microcline", modeDiameterUm: 60, nucleantDenominator: 49, sizeRangeUm: [40, 100] },
  ]);
  expect(rows[1]!.reportedDirections).toEqual([
    { category: "peculiar-shape", greaterGroup: "large-microcline", lesserGroup: "small-microcline" },
    { category: "combination-of-columns", greaterGroup: "small-microcline", lesserGroup: "large-microcline" },
    { category: "radiating-assemblage-of-plates", greaterGroup: "large-microcline", lesserGroup: "small-microcline" },
  ]);
  expect(rows[2]!.groups).toEqual([
    { categoryCounts: null, denominator: 20, denominatorKind: "grown-crystals", groupId: "frozen-droplets", modeDiameterUm: 40, temperatureC: -35 },
  ]);
  expect(rows[2]!.exactDerivedOutcomes).toEqual([
    { category: "peculiar-shape", denominator: 20, derivation: "20 * 35 / 100 = 7", numerator: 7, proportion: 0.35, sourcePrintedPercent: 35 },
  ]);
  return rows;
}

function coherentlyReencodedRegistry(
  mutate: (rows: JsonRecord[]) => void,
): { readonly bytes: Buffer; readonly identity: { readonly byteLength: number; readonly sha256: string } } {
  const rows = registryBytes
    .toString("utf8")
    .trimEnd()
    .split("\n")
    .map((line) => object(JSON.parse(line), "registry mutation row"));
  mutate(rows);
  const bytes = Buffer.from(`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  return {
    bytes,
    identity: { byteLength: bytes.byteLength, sha256: sha256(bytes) },
  };
}

describe("Phase 9 M-S categorical pre-score package", () => {
  it("binds and independently validates the exact Sato registry", () => {
    parseAndValidateRegistry();
    expect(() =>
      phase9MsValidateRegistrySnapshot(registryBytes, {
        byteLength: PHASE9_MS_REGISTRY_BYTE_LENGTH,
        sha256: PHASE9_MS_REGISTRY_SHA256,
      }),
    ).not.toThrow();
  });

  it("rejects coherent registry re-pins that change a count or invent a direction", () => {
    const changedCount = coherentlyReencodedRegistry((rows) => {
      const groups = object(rows[1], "microcline row").groups as JsonRecord[];
      object(groups[0], "small microcline group").crystalCount = 88;
    });
    expect(() =>
      phase9MsValidateRegistrySnapshot(changedCount.bytes, changedCount.identity),
    ).toThrow(/groups semantic mismatch/);

    const inventedDirection = coherentlyReencodedRegistry((rows) => {
      const directions = object(rows[0], "preactivation row").reportedDirections as JsonRecord[];
      directions.push({
        category: "radiating-assemblage-of-plates",
        greaterGroup: "preactivation",
        lesserGroup: "initial",
      });
    });
    expect(() =>
      phase9MsValidateRegistrySnapshot(inventedDirection.bytes, inventedDirection.identity),
    ).toThrow(/reportedDirections semantic mismatch/);
  });

  it("computes only the predeclared descriptive Sato outputs", () => {
    const preactivation = phase9MsEvaluateSato(registryBytes, "preactivation-reported-directions");
    expect(preactivation).toMatchObject({
      status: "reported-directions-only",
      denominators: { initial: 42, preactivation: 36 },
      numericMorphologyEffect: null,
      contingencyDiagnostic: null,
      sourceDataScoreProduced: false,
      causalEffectEstimated: false,
      grantsValidationClaim: false,
    });
    const morphology = phase9MsEvaluateSato(registryBytes, "microcline-morphology-reported-directions");
    expect(morphology).toMatchObject({
      status: "reported-directions-only",
      numericMorphologyEffect: null,
      contingencyDiagnostic: null,
    });
    const contrast = phase9MsEvaluateSato(registryBytes, "microcline-nucleation-proportion-contrast");
    expect(contrast.status).toBe("descriptive-nucleation-proportion-contrast-only");
    if (contrast.status !== "descriptive-nucleation-proportion-contrast-only") throw new Error("unexpected result");
    expect(contrast.smallMicrocline.proportion).toBe(89 / 112);
    expect(contrast.largeMicrocline.proportion).toBe(48 / 49);
    expect(contrast.largeMinusSmallProportion).toBe(48 / 49 - 89 / 112);
    expect(contrast.nullModelDiagnostic.table).toEqual([[89, 23], [48, 1]]);
    expect(contrast.nullModelDiagnostic.asymptoticPValue).toBeNull();
    expect(contrast.nullModelDiagnostic.smallCellWarning).toBe(false);
    const droplet = phase9MsEvaluateSato(registryBytes, "frozen-droplet-peculiar-proportion");
    expect(droplet).toMatchObject({
      status: "reported-single-group-proportion-only",
      numerator: 7,
      denominator: 20,
      proportion: 0.35,
      sourcePrintedPercent: 35,
      betweenGroupContrast: null,
    });
  });

  it("independently recomputes the two-by-two null-model diagnostic", () => {
    const result = phase9MsTwoByTwoNullModelDiagnostic({
      purpose: "registered-descriptive-two-by-two-null-model",
      table: [[89, 23], [48, 1]],
    });
    const observed = [[89, 23], [48, 1]];
    const rowTotals = [112, 49];
    const columnTotals = [137, 24];
    const total = 161;
    const expected = rowTotals.map((rowTotal) =>
      columnTotals.map((columnTotal) => (rowTotal * columnTotal) / total),
    );
    const independentlyComputed = observed.reduce(
      (sum, row, rowIndex) =>
        sum + row.reduce((rowSum, cell, columnIndex) => {
          const residual = cell - expected[rowIndex]![columnIndex]!;
          return rowSum + (residual * residual) / expected[rowIndex]![columnIndex]!;
        }, 0),
      0,
    );
    expect(result.rowTotals).toEqual(rowTotals);
    expect(result.columnTotals).toEqual(columnTotals);
    expect(result.pearsonChiSquare).toBeCloseTo(independentlyComputed, 14);
    expect(result.pooledSuccessProportion).toBe(137 / 161);
    expect(result.asymptoticPValue).toBeNull();
  });

  it("retains Bacon's missing-denominator refusal for both aggregates", () => {
    const selections: Phase9MsBaconSelectionId[] = [
      "P8B-P1-BACON-INITIATION-ASPECT",
      "P8B-P1-BACON-MASS-GROWTH-CONTRAST",
    ];
    for (const selection of selections) {
      expect(phase9MsEvaluateBaconAggregate(selection, "directional-range-description")).toMatchObject({
        status: "refused",
        reasonCode: "MISSING_DENOMINATOR_AND_EXPOSURE_CONFOUND",
        computedProportion: null,
      });
      expect(phase9MsEvaluateBaconAggregate(selection, "frequency-or-effect-size")).toMatchObject({
        status: "refused",
        reasonCode: "NO_DENOMINATOR_NO_INDIVIDUAL_ROWS",
        computedProportion: null,
      });
    }
  });

  it("fails closed on registry, purpose, and contingency mutations", () => {
    const changed = Buffer.from(registryBytes);
    changed[100] = changed[100]! ^ 1;
    expect(() => phase9MsEvaluateSato(changed, "preactivation-reported-directions")).toThrow(/SHA-256/);
    expect(() => phase9MsEvaluateSato(registryBytes.subarray(0, -1), "preactivation-reported-directions")).toThrow(/byte length/);
    expect(() => phase9MsEvaluateSato(registryBytes, "unknown" as Phase9MsSatoPurpose)).toThrow(/unknown M-S Sato purpose/);
    expect(() => phase9MsEvaluateBaconAggregate("unknown" as Phase9MsBaconSelectionId, "frequency-or-effect-size")).toThrow(/unknown M-S Bacon selection/);
    expect(() => phase9MsEvaluateBaconAggregate("P8B-P1-BACON-INITIATION-ASPECT", "unknown" as Phase9MsBaconPurpose)).toThrow(/unknown M-S Bacon purpose/);
    expect(() => phase9MsTwoByTwoNullModelDiagnostic({ purpose: "unknown" as "registered-descriptive-two-by-two-null-model", table: [[1, 1], [1, 1]] })).toThrow(/unknown M-S null-model purpose/);
    expect(() => phase9MsTwoByTwoNullModelDiagnostic({ purpose: "registered-descriptive-two-by-two-null-model", table: [[Number.MAX_SAFE_INTEGER, 1], [1, 1]] })).toThrow(/safe-integer domain/);
    expect(() => phase9MsTwoByTwoNullModelDiagnostic({ purpose: "registered-descriptive-two-by-two-null-model", table: [[0, 0], [1, 1]] })).toThrow(/row totals/);
    expect(() => phase9MsTwoByTwoNullModelDiagnostic({ purpose: "registered-descriptive-two-by-two-null-model", table: [[1, 0], [1, 0]] })).toThrow(/column totals/);
  });

  it("independently validates protocol fields and live bound hashes", () => {
    const protocol = JSON.parse(readFileSync(protocolPath, "utf8")) as unknown;
    validateProtocol(protocol, true);
    expect(PHASE9_MS_CLAIM_BOUNDARY).toEqual({
      phase9Role: "pre-score-descriptive-development-only",
      sourceDataScoreProduced: false,
      causalEffectEstimated: false,
      matchedExposureClaimAvailable: false,
      physicalPromotionEligible: false,
      grantsValidationClaim: false,
    });
  });

  it("executes twenty-three independent load-bearing protocol mutations", () => {
    const original = JSON.parse(readFileSync(protocolPath, "utf8")) as JsonRecord;
    const mutations: readonly ((draft: JsonRecord) => void)[] = [
      (draft) => { draft.schema = "wrong"; },
      (draft) => { object(draft.state, "state").measurementScoresProduced = 1; },
      (draft) => { object(draft.state, "state").publicationAuthorized = true; },
      (draft) => { object(draft.state, "state").causalEffectsEstimated = 1; },
      (draft) => { object(object(draft.upstreamBindings, "bindings").sourceOverlay, "overlay").exactMsShelf = {}; },
      (draft) => { object(object(draft.upstreamBindings, "bindings").sourcePdfs, "pdfs").runtimeReadsNas = true; },
      (draft) => { object(object(object(draft.upstreamBindings, "bindings").sourcePdfs, "pdfs").sato, "sato").sha256 = PHASE9_MS_BACON_SHA256; },
      (draft) => { object(object(object(draft.upstreamBindings, "bindings").sourcePdfs, "pdfs").bacon, "bacon").byteLength = 1; },
      (draft) => { object(draft.pageAudit, "pageAudit").requiredLoadBearingPages = [16, 17, 18]; },
      (draft) => { object(draft.registryPolicy, "registryPolicy").unprintedBarCounts = "digitized"; },
      (draft) => { draft.authorizedDiagnostics = []; },
      (draft) => { object(draft.baconMissingDenominatorRefusal, "refusal").computedFrequency = "allowed"; },
      (draft) => { draft.confounds = []; },
      (draft) => { object(draft.claimBoundary, "claimBoundary").causalEffectEstimated = true; },
      (draft) => {
        object(object(draft.implementationArtifacts, "artifacts").categoricalRegistry, "registry").path =
          resolve(root, "research/phase9-ms-categorical-registry-v1.jsonl");
      },
      (draft) => {
        object(object(draft.implementationArtifacts, "artifacts").pureEvaluator, "evaluator").path =
          "runner/src/../src/phase9-ms-categorical.ts";
      },
      (draft) => {
        object(object(object(draft.upstreamBindings, "bindings").sourceOverlay, "overlay").shelfFreeze, "shelf").path =
          resolve(root, "evidence/phase9-source-overlay-v1/shelf-freeze.json");
      },
      (draft) => {
        object(object(object(draft.upstreamBindings, "bindings").sourceOverlay, "overlay").satoCorrection, "correction").path =
          "./research/phase9-sato-source-correction.md";
      },
      (draft) => {
        object(object(object(draft.upstreamBindings, "bindings").baconRecords, "bacon").records, "records").path =
          "./evidence/phase8b-bacon-seed-history-v1/records.jsonl";
      },
      (draft) => {
        object(object(object(draft.upstreamBindings, "bindings").genericCategoricalAdapter, "adapter").implementation, "implementation").path =
          "runner/src/../src/phase9-measurement-adapters.ts";
      },
      (draft) => {
        object(object(draft.implementationArtifacts, "artifacts").categoricalRegistry, "registry").sha256 =
          "0".repeat(64);
      },
      (draft) => {
        object(object(draft.implementationArtifacts, "artifacts").focusedTest, "test").byteLength = 1;
      },
      (draft) => {
        object(object(object(draft.upstreamBindings, "bindings").sourceOverlay, "overlay").report, "report").sha256 =
          "0".repeat(64);
      },
    ];
    expect(mutations).toHaveLength(23);
    for (const mutate of mutations) {
      const draft = structuredClone(original);
      mutate(draft);
      expect(() => validateProtocol(draft, false)).toThrow();
    }
  });
});
