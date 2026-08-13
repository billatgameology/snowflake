import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  canonicalJsonBytes,
  parseCanonicalJson,
  sha256Bytes,
} from "../src/gate4-evidence.ts";
import {
  PHASE9_MF_MK2_SERIES,
  phase9MfMk2MapPlottedSupersaturation,
  phase9MfMk2PredictRateUmPerS,
  type Phase9MfMk2SeriesId,
} from "../src/phase9-mf-mk2-model.ts";
import {
  PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS,
  derivePhase9MfMk2Publication,
  validatePhase9MfMk2ScoreLaunch,
  writePhase9MfMk2Publication,
  type Phase9MfMk2BoundSeries,
  type Phase9MfMk2RunMaterial,
} from "../src/phase9-mf-mk2-publication.ts";
import {
  executePhase9MfMk2PublicationNegativeControls,
  mutatePhase9MfMk2Publication,
  verifyPhase9MfMk2Publication,
  type Phase9MfMk2PublicationMutationId,
  type Phase9MfMk2VerificationInputs,
} from "../src/phase9-mf-mk2-publication-verify.ts";

interface ArtifactIdentity {
  readonly path: string;
  readonly byteLength: number;
  readonly sha256: string;
}

interface FrozenProtocol {
  readonly protocolId: string;
  readonly entryArtifacts: readonly ArtifactIdentity[];
  readonly seriesRoster: readonly {
    readonly selectionId: Phase9MfMk2SeriesId;
    readonly rowArtifact: {
      readonly logicalRoot: string;
      readonly path: string;
    };
  }[];
}

const EXPECTED_ADAPTER_REASONS = Object.freeze([
  "coordinates are plot digitizations with retained extraction intervals, not exact source-reported values",
  "the crystals were substrate-supported at low pressure",
  "the per-series denominator and point dispersion were not reported",
  "SURFACE_FORCING_MAPPING_UNRESOLVED",
  "development evidence only",
  "freeze far-field-to-surface mapping before a score",
  "do not invent series denominators or dispersion",
] as const);

function bytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(path)));
}

function identity(path: string, value: Uint8Array): ArtifactIdentity {
  return { path, byteLength: value.byteLength, sha256: sha256Bytes(value) };
}

function jsonl(rows: readonly unknown[]): Uint8Array {
  return new TextEncoder().encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function repositoryInputs(): ReadonlyMap<string, Uint8Array> {
  const result = new Map<string, Uint8Array>(
    PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS.map((path) => [path, bytes(path)]),
  );
  const protocol = JSON.parse(new TextDecoder().decode(
    result.get("research/phase9-mf-mk2-protocol-v1.json") as Uint8Array,
  )) as FrozenProtocol;
  for (const entry of protocol.entryArtifacts) {
    if (!result.has(entry.path)) result.set(entry.path, bytes(entry.path));
  }
  return result;
}

function syntheticScoreLaunch(
  protocolId: string,
  inputs: ReadonlyMap<string, Uint8Array>,
  scoreMayRun = true,
): Uint8Array {
  return canonicalJsonBytes({
    schema: "phase9-mf-mk2-launch-v1",
    scope: "synthetic-fixture",
    protocolId,
    scoreMayRun,
    sourceFoundation: {
      s0b: "frozen-independent-verifier-pass",
      s1: "complete-fail-closed-adapters",
    },
    assurance: {
      syntheticPublicationChecks: "passed",
      independentReview: "accepted",
    },
    bindings: PHASE9_MF_MK2_LAUNCH_REQUIRED_PATHS.map((path) => identity(
      path,
      inputs.get(path) as Uint8Array,
    )),
  });
}

function syntheticRowBytes(
  selectionId: Phase9MfMk2SeriesId,
  rowCount: number,
): Uint8Array {
  const target = selectionId === "P8B-P1-S89-F3-PRISM" || selectionId === "P8B-P1-S89-F4-PRISM"
    ? "mk2-prism-annex"
    : "mf-inherited-cak-control";
  return jsonl(Array.from({ length: rowCount }, (_unused, index) => {
    const value = 1 + index * 0.05;
    const x = { lower: value - 0.02, value, upper: value + 0.02 };
    const mapped = phase9MfMk2MapPlottedSupersaturation(
      x,
      "diagnostic-proportional-q0.5",
    );
    const prediction = phase9MfMk2PredictRateUmPerS(target, selectionId, mapped.value);
    if (prediction.status !== "predicted") throw new Error("synthetic target is unexpectedly ineligible");
    const rate = prediction.rateUmPerS;
    return {
      schema: "phase8b-plot-point-v1",
      selectionId,
      pointId: `p${String(index + 1).padStart(3, "0")}`,
      phase9EvidenceRole: "model-development",
      x: {
        variable: "supersaturation",
        unit: "percent",
        value,
        digitizationLower: x.lower,
        digitizationUpper: x.upper,
      },
      y: {
        variable: "normal_growth_rate",
        unit: "um s^-1",
        value: rate,
        digitizationLower: Math.max(0, rate - 0.0005),
        digitizationUpper: rate + 0.0005,
      },
    };
  }));
}

function fixture(): {
  readonly material: Phase9MfMk2RunMaterial;
  readonly verification: Phase9MfMk2VerificationInputs;
} {
  const protocolBytes = bytes("research/phase9-mf-mk2-protocol-v1.json");
  const protocol = JSON.parse(new TextDecoder().decode(protocolBytes)) as FrozenProtocol;
  const inputs = repositoryInputs();
  const scoreLaunchBytes = syntheticScoreLaunch(protocol.protocolId, inputs);
  const sourceRows = new Map<string, Uint8Array>();
  const series: Phase9MfMk2BoundSeries[] = PHASE9_MF_MK2_SERIES.map((registration) => {
    const frozen = protocol.seriesRoster.find((row) => row.selectionId === registration.selectionId);
    if (frozen === undefined) throw new Error(`protocol lacks ${registration.selectionId}`);
    const sourceBytes = syntheticRowBytes(registration.selectionId, registration.rowCount);
    sourceRows.set(registration.selectionId, sourceBytes);
    return {
      registration,
      sourceArtifact: {
        logicalRoot: frozen.rowArtifact.logicalRoot,
        path: frozen.rowArtifact.path,
        byteLength: sourceBytes.byteLength,
        sha256: sha256Bytes(sourceBytes),
      },
      sourceBytes,
      adapterStatus: "eligible-with-limitation",
      adapterReasons: EXPECTED_ADAPTER_REASONS,
    };
  });
  const material: Phase9MfMk2RunMaterial = {
    scope: "synthetic-fixture",
    protocolId: protocol.protocolId,
    protocolIdentity: identity("research/phase9-mf-mk2-protocol-v1.json", protocolBytes),
    scoreLaunchIdentity: identity("research/phase9-mf-mk2-launch-v1.json", scoreLaunchBytes),
    evaluatorIdentities: protocol.entryArtifacts,
    series,
    runtime: { node: "synthetic-node", platform: "synthetic-platform", architecture: "synthetic-arch" },
    command: ["synthetic-fixture"],
  };
  const bundle = derivePhase9MfMk2Publication(material);
  return {
    material,
    verification: {
      artifacts: bundle.artifacts,
      protocolBytes,
      scoreLaunchBytes,
      sourceRows,
      repositoryInputs: inputs,
    },
  };
}

function parsedJsonl(path: string, artifacts: ReadonlyMap<string, Uint8Array>): Record<string, unknown>[] {
  return new TextDecoder().decode(artifacts.get(path) as Uint8Array)
    .trimEnd()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function mutationWitness(
  id: Phase9MfMk2PublicationMutationId,
  artifacts: ReadonlyMap<string, Uint8Array>,
): unknown {
  const scores = (): Record<string, unknown>[] => parsedJsonl("series-scores.jsonl", artifacts);
  const mappings = (): Record<string, unknown>[] => parsedJsonl("mapping-decisions.jsonl", artifacts);
  if (id === "drop-one-registered-series") {
    return scores().filter((row) =>
      row.mappingId === "diagnostic-proportional-q0.125" && row.model === "mf-inherited-cak-control"
    ).length;
  }
  if (id === "duplicate-one-series") {
    return scores().filter((row) =>
      row.mappingId === "diagnostic-proportional-q0.125" &&
      row.model === "mf-inherited-cak-control" &&
      row.selectionId === "P8B-P1-S89-F3-BASAL"
    ).length;
  }
  if (id === "fabricate-minus-fifteen-second-branch") {
    const launch = parseCanonicalJson(artifacts.get("launch-manifest.json") as Uint8Array) as {
      modelContract: { mk2PrismAnnex: { minusFifteen: readonly unknown[] } };
    };
    return launch.modelContract.mk2PrismAnnex.minusFifteen.length;
  }
  if (id === "attempt-minus-thirty-score") {
    const row = scores().find((candidate) =>
      candidate.mappingId === "diagnostic-proportional-q0.125" &&
      candidate.model === "mk2-prism-annex" &&
      candidate.selectionId === "P8B-P1-S89-F5-BASAL"
    );
    return `${String(row?.status)}:${String(row?.reasonCode)}`;
  }
  if (id === "change-mk2-basal-away-from-control") {
    return (mappings()[0]?.basalIdentity as { bitIdentical: boolean }).bitIdentical;
  }
  if (id === "admit-source-blocked-physical-map") {
    const report = parseCanonicalJson(artifacts.get("report.json") as Uint8Array) as {
      physicalScore: { status: string; promotionAvailable: boolean };
    };
    return `${report.physicalScore.status}:${String(report.physicalScore.promotionAvailable)}`;
  }
  if (id === "forge-adapter-eligibility") {
    const launch = parseCanonicalJson(artifacts.get("launch-manifest.json") as Uint8Array) as {
      sourceArtifacts: Array<{ adapterStatus: string }>;
    };
    return launch.sourceArtifacts[0]?.adapterStatus;
  }
  if (id === "erase-limitation") {
    const launch = parseCanonicalJson(artifacts.get("launch-manifest.json") as Uint8Array) as {
      sourceArtifacts: Array<{ adapterReasons: readonly string[] }>;
    };
    return launch.sourceArtifacts[0]?.adapterReasons.includes("SURFACE_FORCING_MAPPING_UNRESOLVED");
  }
  const family = mappings()[0]?.mfSixSeries as {
    weighting: string;
    pooledPointScoreForbidden: boolean;
  };
  return `${family.weighting}:${String(family.pooledPointScoreForbidden)}`;
}

describe("Phase 9 M-F/M-K2 publication launch boundary", () => {
  it("requires a separate hash-bound, affirmative post-review launch record", () => {
    const protocolBytes = bytes("research/phase9-mf-mk2-protocol-v1.json");
    const protocol = JSON.parse(new TextDecoder().decode(protocolBytes)) as FrozenProtocol;
    const inputs = repositoryInputs();
    const launch = syntheticScoreLaunch(protocol.protocolId, inputs);
    expect(validatePhase9MfMk2ScoreLaunch(
      launch,
      process.cwd(),
      protocol.protocolId,
      "synthetic-fixture",
    )).toEqual(
      identity("research/phase9-mf-mk2-launch-v1.json", launch),
    );
    expect(() => validatePhase9MfMk2ScoreLaunch(
      syntheticScoreLaunch(protocol.protocolId, inputs, false),
      process.cwd(),
      protocol.protocolId,
      "synthetic-fixture",
    )).toThrow(/does not authorize/u);

    const changed = JSON.parse(new TextDecoder().decode(launch)) as {
      bindings: Array<{ path: string; byteLength: number; sha256: string }>;
    };
    changed.bindings[0] = { ...changed.bindings[0] as ArtifactIdentity, sha256: "0".repeat(64) };
    expect(() => validatePhase9MfMk2ScoreLaunch(
      canonicalJsonBytes(changed),
      process.cwd(),
      protocol.protocolId,
      "synthetic-fixture",
    )).toThrow(/binding differs/u);
  });
});

describe("Phase 9 M-F/M-K2 diagnostic producer", () => {
  it("publishes all five mappings, exact family rosters, refusals, and no physical score", () => {
    const { verification } = fixture();
    const scores = parsedJsonl("series-scores.jsonl", verification.artifacts);
    const mappings = parsedJsonl("mapping-decisions.jsonl", verification.artifacts);
    expect(scores).toHaveLength(90);
    expect(scores.filter((row) => row.status === "scored-diagnostic")).toHaveLength(80);
    expect(scores.filter((row) => row.reasonCode === "MK2_NO_MINUS_30_ROW")).toHaveLength(10);
    expect(scores.filter((row) => row.model === "mf-inherited-cak-control")).toHaveLength(30);
    expect(scores.filter((row) => row.model === "zero-growth-control")).toHaveLength(30);
    expect(mappings).toHaveLength(5);
    for (const row of mappings) {
      expect(row).toMatchObject({
        mappingStatus: "diagnostic-only",
        mfSixSeries: { weighting: "equal-series", pooledPointScoreForbidden: true },
        mk2FourSeriesDomain: { weighting: "equal-series", pooledPointScoreForbidden: true },
        zeroControlSixSeries: { weighting: "equal-series", pooledPointScoreForbidden: true },
        basalIdentity: { evaluatedPointCount: 36, bitIdentical: true },
        physicalScore: {
          status: "unavailable",
          sourceMappingStatus: "source-blocked",
          grantsValidationClaim: false,
          promotionAvailable: false,
        },
      });
      expect((row.minusThirtyRefusals as unknown[])).toHaveLength(2);
    }
    const report = parseCanonicalJson(
      verification.artifacts.get("report.json") as Uint8Array,
      "report",
    ) as Record<string, unknown>;
    expect(report).toMatchObject({
      phase9EvidenceRole: "model-development",
      counts: {
        sourceSeries: 6,
        sourcePoints: 96,
        diagnosticMappings: 5,
        seriesScoreRecords: 90,
        scoredDiagnosticRecords: 80,
        explicitMinusThirtyRefusals: 10,
      },
      physicalScore: {
        status: "unavailable",
        grantsValidationClaim: false,
        promotionAvailable: false,
      },
      uncertaintyLimitations: {
        observation: expect.stringContaining("denominator"),
        prediction: expect.stringContaining("not a complete prediction interval"),
        overlap: expect.stringContaining("not statistical agreement"),
      },
      claimBoundary: {
        morphologyInterpretationStopped: true,
        heldoutEvidence: false,
        quantitativeValidation: false,
        pooledPointScoreForbidden: true,
      },
    });
  });

  it("will not write a synthetic candidate into an evidence directory", () => {
    const { material } = fixture();
    const bundle = derivePhase9MfMk2Publication(material);
    expect(() => writePhase9MfMk2Publication(bundle, "/private/tmp/phase9-mf-mk2-synthetic-forbidden"))
      .toThrow(/synthetic fixtures cannot be published/u);
  });
});

describe("Phase 9 M-F/M-K2 independent publication verifier", () => {
  it("reparses source rows and independently rederives every published arithmetic byte", () => {
    const { verification } = fixture();
    expect(verifyPhase9MfMk2Publication(verification)).toMatchObject({
      ok: true,
      errors: [],
      scope: "synthetic-fixture",
    });
  });

  it("does not import either producer or model decision code", () => {
    const source = readFileSync(resolve("runner/src/phase9-mf-mk2-publication-verify.ts"), "utf8");
    expect(source).not.toMatch(/from ["'].\/phase9-mf-mk2-publication/u);
    expect(source).not.toMatch(/from ["'].\/phase9-mf-mk2-model/u);
    expect(source).not.toMatch(/from ["'].\/phase9-measurement-adapters/u);
  });

  it("executes and rejects every named, re-indexed semantic mutation", () => {
    const { verification } = fixture();
    const outcomes = executePhase9MfMk2PublicationNegativeControls(verification);
    expect(outcomes).toHaveLength(9);
    expect(outcomes.every((row) => row.mutationExecuted && row.rejected)).toBe(true);
    const expected: Phase9MfMk2PublicationMutationId[] = [
      "drop-one-registered-series",
      "duplicate-one-series",
      "fabricate-minus-fifteen-second-branch",
      "attempt-minus-thirty-score",
      "change-mk2-basal-away-from-control",
      "admit-source-blocked-physical-map",
      "pool-points-instead-of-equal-series",
      "forge-adapter-eligibility",
      "erase-limitation",
    ];
    expect(outcomes.map((row) => row.id)).toEqual(expected);
    const expectedWitnesses: Record<Phase9MfMk2PublicationMutationId, readonly [unknown, unknown]> = {
      "drop-one-registered-series": [6, 5],
      "duplicate-one-series": [1, 2],
      "fabricate-minus-fifteen-second-branch": [1, 2],
      "attempt-minus-thirty-score": ["ineligible:MK2_NO_MINUS_30_ROW", "scored-diagnostic:undefined"],
      "change-mk2-basal-away-from-control": [true, false],
      "admit-source-blocked-physical-map": ["unavailable:false", "available:true"],
      "pool-points-instead-of-equal-series": ["equal-series:true", "pooled-points:false"],
      "forge-adapter-eligibility": ["eligible-with-limitation", "eligible"],
      "erase-limitation": [true, false],
    };
    for (const id of expected) {
      const mutated = mutatePhase9MfMk2Publication(verification.artifacts, id);
      expect(
        [mutationWitness(id, verification.artifacts), mutationWitness(id, mutated)],
        `${id} did not execute its named semantic mutation`,
      ).toEqual(expectedWitnesses[id]);
      expect(sha256Bytes(mutated.get("artifact-index.json") as Uint8Array)).not.toBe(
        sha256Bytes(verification.artifacts.get("artifact-index.json") as Uint8Array),
      );
      expect(verifyPhase9MfMk2Publication({ ...verification, artifacts: mutated }).ok, id).toBe(false);
    }
  });

  it("rejects a source-row mutation rather than inheriting the producer's report", () => {
    const { verification } = fixture();
    const changedRows = new Map(verification.sourceRows);
    const selectionId = "P8B-P1-S89-F3-BASAL";
    const original = changedRows.get(selectionId) as Uint8Array;
    const changed = new Uint8Array(original);
    changed[10] = changed[10] === 48 ? 49 : 48;
    changedRows.set(selectionId, changed);
    const result = verifyPhase9MfMk2Publication({ ...verification, sourceRows: changedRows });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/source identity differs/u);
  });
});
