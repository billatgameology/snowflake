import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  adaptPhase9CategoricalAtlas,
  adaptPhase9CategoricalIntervention,
  adaptPhase9FreeFallEnsemble,
  adaptPhase9GasPressureIntervention,
  adaptPhase9MeasurementCorpus,
  adaptPhase9SpatialRoughness,
  adaptPhase9Sublimation,
  validatePhase9AdapterRegistry,
  type Phase9PostPhase8SourceInput,
} from "../src/phase9-measurement-adapters.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const root = join(import.meta.dirname, "../..");
const registryBytes = readFileSync(join(root, "research/phase9-adapter-registry-v1.jsonl"));
const successorBytes = readFileSync(join(root, "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl"));
const metadataPaths = [
  "evidence/phase8b-native-histories-v1/records.jsonl",
  "evidence/phase8b-plot-digitization-v3/records.jsonl",
  "evidence/phase8b-bacon-seed-history-v1/records.jsonl",
  "evidence/phase8b-p2-terminal-v1/records.jsonl",
] as const;
const metadataArtifacts = new Map<string, Uint8Array>(metadataPaths.map((path) => [path, readFileSync(join(root, path))]));

function jsonl(rows: readonly unknown[]): Uint8Array {
  return encoder.encode(`${rows.map((row) => canonicalJson(row)).join("\n")}\n`);
}

function baseRow(schema: string, sourceOrdinal: number, extra: Record<string, unknown>): Record<string, unknown> {
  return {
    conditions: { temperatureC: -15 },
    metadataRecordId: "POST-META-1",
    schema,
    selectionId: "POST-SELECTION-1",
    sourceOrdinal,
    sourceRowId: `row-${sourceOrdinal}`,
    sourceUnitId: null,
    uncertainty: { source: "reported" },
    ...extra,
  };
}

function postInput(rows: readonly unknown[], options: { readonly includeBytes?: boolean; readonly sourceBytes?: Uint8Array } = {}): Phase9PostPhase8SourceInput {
  const registeredBytes = jsonl(rows);
  return {
    binding: {
      selectionId: "POST-SELECTION-1",
      metadataRecordId: "POST-META-1",
      sourceUnitId: null,
      descriptor: {
        byteLength: registeredBytes.byteLength,
        format: "canonical-jsonl",
        path: "research-cache/phase9-derived/post-source.jsonl",
        sha256: sha256Bytes(registeredBytes),
      },
    },
    ...(options.includeBytes === false ? {} : { sourceBytes: options.sourceBytes ?? registeredBytes }),
  };
}

function registeredCorpus(requestedPurposes?: ReadonlyMap<string, string>) {
  return adaptPhase9MeasurementCorpus({
    registryBytes,
    successorTargetBookBytes: successorBytes,
    metadataArtifacts,
    rowArtifacts: new Map(),
    ...(requestedPurposes === undefined ? {} : { requestedPurposes }),
  });
}

describe("Phase 9 registered measurement adapters", () => {
  it("enforces production pins and exact 51-row registry/successor coverage", () => {
    const rows = validatePhase9AdapterRegistry(registryBytes, successorBytes);
    expect(rows).toHaveLength(51);
    expect(new Set(rows.map((row) => row.selectionId)).size).toBe(51);
    expect(rows.every((row) => row.requestedUses.length > 0 && row.knowledgeHypothesisIds.length > 0)).toBe(true);
  });

  it("rejects a registry mutation instead of exposing a fixture-scope bypass", () => {
    const mutated = new Uint8Array(registryBytes);
    mutated[10] = mutated[10] === 65 ? 66 : 65;
    expect(() => validatePhase9AdapterRegistry(mutated, successorBytes)).toThrow(/registry byte\/hash pin differs/);
  });

  it("rejects a successor-book mutation instead of exposing a fixture-scope bypass", () => {
    const mutated = new Uint8Array(successorBytes);
    mutated[10] = mutated[10] === 65 ? 66 : 65;
    expect(() => validatePhase9AdapterRegistry(registryBytes, mutated)).toThrow(/successor target book byte\/hash pin differs/);
  });

  it("accepts only the exhaustive registered binding/adapter pair matrix", () => {
    const rows = validatePhase9AdapterRegistry(registryBytes, successorBytes);
    const pairs = new Set(rows.map((row) => `${row.bindingKind}/${row.adapterKind}`));
    expect([...pairs].sort()).toEqual([
      "digitized-plot-series/gas-pressure-intervention",
      "digitized-plot-series/planar-facet",
      "digitized-plot-series/supported-dimension-rim",
      "direct-bacon-reported-aggregate/initiation-aggregate",
      "native-history/free-particle-mass",
      "native-history/supported-dimension-rim",
      "terminal-interpretive-dependency/interpretive-constraint",
    ]);
  });

  it("validates every available metadata field and tags unavailable NAS bodies source-blocked", () => {
    const results = registeredCorpus();
    expect(results).toHaveLength(51);
    expect(results.find((row) => row.selectionId === "P8B-P0-D6442E662770C35854FB2D8B")).toMatchObject({
      metadataRecordId: "P8B-NATIVE-MASS-725C",
      sourceUnitId: "P8B-UNIT-D6442E662770C35854FB2D8B",
      status: "source-blocked",
    });
    expect(results.find((row) => row.selectionId === "P8B-P1-BACON-INITIATION-ASPECT")?.status).toBe("eligible-with-limitation");
  });

  it("rejects metadata descriptor tampering", () => {
    const wrong = new Map(metadataArtifacts);
    wrong.set(metadataPaths[0], metadataArtifacts.get(metadataPaths[1]) as Uint8Array);
    expect(() => adaptPhase9MeasurementCorpus({
      registryBytes, successorTargetBookBytes: successorBytes, metadataArtifacts: wrong, rowArtifacts: new Map(),
    })).toThrow(/metadata artifact byte\/hash pin differs/);
  });

  it("rejects a metadata identity mutation through its frozen descriptor", () => {
    const wrong = new Map(metadataArtifacts);
    const bytes = metadataArtifacts.get(metadataPaths[0]) as Uint8Array;
    wrong.set(metadataPaths[0], encoder.encode(decoder.decode(bytes).replace("P8B-NATIVE-DIMENSIONS-20231128", "P8B-NATIVE-DIMENSIONS-20231129")));
    expect(() => adaptPhase9MeasurementCorpus({
      registryBytes, successorTargetBookBytes: successorBytes, metadataArtifacts: wrong, rowArtifacts: new Map(),
    })).toThrow(/metadata artifact byte\/hash pin differs/);
  });

  it("rejects noncanonical and duplicate metadata before either can alter a mapping", () => {
    const bytes = metadataArtifacts.get(metadataPaths[3]) as Uint8Array;
    const text = decoder.decode(bytes);
    for (const changed of [encoder.encode(` ${text}`), encoder.encode(`${text}${text.split("\n")[0]}\n`)]) {
      const wrong = new Map(metadataArtifacts);
      wrong.set(metadataPaths[3], changed);
      expect(() => adaptPhase9MeasurementCorpus({
        registryBytes, successorTargetBookBytes: successorBytes, metadataArtifacts: wrong, rowArtifacts: new Map(),
      })).toThrow(/metadata artifact byte\/hash pin differs/);
    }
  });

  it("applies claim-specific secondary-use refusals from the tracked registry", () => {
    const results = registeredCorpus(new Map([
      ["P8B-P1-BACON-INITIATION-ASPECT", "distribution-or-effect-size"],
      ["P8B-P2-HP25-SOURCE-SEMANTICS", "absolute-forcing-score"],
      ["P8B-P2-INPUT-LINEAGE", "independent-validation-witness"],
    ]));
    expect(results.find((row) => row.selectionId === "P8B-P1-BACON-INITIATION-ASPECT")).toMatchObject({
      status: "ineligible", requestedUse: { purpose: "distribution-or-effect-size" },
    });
    expect(results.find((row) => row.selectionId === "P8B-P2-HP25-SOURCE-SEMANTICS")).toMatchObject({
      status: "source-blocked", requestedUse: { purpose: "absolute-forcing-score" },
    });
    expect(results.find((row) => row.selectionId === "P8B-P2-INPUT-LINEAGE")).toMatchObject({
      status: "ineligible", requestedUse: { purpose: "independent-validation-witness" },
    });
  });
});

describe("Phase 9 post-Phase8 source-bound adapters", () => {
  it("returns source-blocked when the bound source bytes are unavailable", () => {
    const row = baseRow("phase9-categorical-intervention-row-v1", 1, {
      denominator: 10, groupLabel: "treated", intervention: "preactivation", outcomeCount: 4,
    });
    expect(adaptPhase9CategoricalIntervention(postInput([row], { includeBytes: false })).status).toBe("source-blocked");
  });

  it("rejects bytes that differ from the supplied source descriptor", () => {
    const row = baseRow("phase9-categorical-intervention-row-v1", 1, {
      denominator: 10, groupLabel: "treated", intervention: "preactivation", outcomeCount: 4,
    });
    expect(() => adaptPhase9CategoricalIntervention(postInput([row], { sourceBytes: encoder.encode("tampered\n") }))).toThrow(/byte\/hash pin differs/);
  });

  it("parses categorical counts from bound bytes and remains policy-blocked", () => {
    const rows = [
      baseRow("phase9-categorical-intervention-row-v1", 1, { denominator: 42, groupLabel: "preactivated", intervention: "preactivation", outcomeCount: 12 }),
      baseRow("phase9-categorical-intervention-row-v1", 2, { denominator: 36, groupLabel: "control", intervention: "preactivation", outcomeCount: 7 }),
    ];
    const adapted = adaptPhase9CategoricalIntervention(postInput(rows));
    expect(adapted.status).toBe("source-blocked");
    expect(adapted.observations[0]?.values).toMatchObject({ denominator: 42, outcomeCount: 12 });
    expect(adapted.observations[0]?.sourceLine).toBe(canonicalJson(rows[0]));
  });

  it("marks a one-group categorical artifact ineligible because it has no contrast", () => {
    const row = baseRow("phase9-categorical-intervention-row-v1", 1, {
      denominator: 42, groupLabel: "preactivated", intervention: "preactivation", outcomeCount: 12,
    });
    const adapted = adaptPhase9CategoricalIntervention(postInput([row]));
    expect(adapted.status).toBe("ineligible");
    expect(adapted.reasons.join(" ")).toMatch(/no intervention contrast/);
  });

  it("rejects duplicate categorical physical groups even when row IDs differ", () => {
    const rows = [1, 2].map((ordinal) => baseRow("phase9-categorical-intervention-row-v1", ordinal, {
      denominator: 42, groupLabel: "preactivated", intervention: "preactivation", outcomeCount: 12,
    }));
    expect(() => adaptPhase9CategoricalIntervention(postInput(rows))).toThrow(/duplicates a physical target/);
  });

  it("keeps the atlas schema distinct and refuses categories outside its bound codebook", () => {
    const row = baseRow("phase9-categorical-atlas-row-v1", 1, {
      atlasId: "TAX2", category: "column", codebook: ["plate"], panelId: "panel-1",
    });
    expect(adaptPhase9CategoricalAtlas(postInput([row])).status).toBe("ineligible");
    expect(() => adaptPhase9CategoricalIntervention(postInput([row]))).toThrow(/keys differ|schema/);
  });

  it("enforces gas/pressure lexeme-value equality and physical uniqueness", () => {
    const row = baseRow("phase9-gas-pressure-row-v1", 1, {
      gas: "helium", outcomeLexeme: "5.0", outcomeUnit: "um", outcomeValue: 5,
      outcomeVariable: "mean_a_axis_length", pressurePa: 50000,
      sourceOrderSpan: { high: 6, low: 4 }, transportKind: "vapor-diffusivity",
      transportLexeme: "0.8", transportUnit: "m2/s", transportValue: 0.8,
    });
    const mismatch = { ...row, transportValue: 0.9 };
    expect(() => adaptPhase9GasPressureIntervention(postInput([mismatch]))).toThrow(/lexeme\/value differ/);
    const second = { ...row, sourceOrdinal: 2, sourceRowId: "row-2" };
    expect(() => adaptPhase9GasPressureIntervention(postInput([row, second]))).toThrow(/duplicates a physical target/);
    expect(() => adaptPhase9GasPressureIntervention(postInput([{ ...row, transportUnit: "W\/(m K)" }]))).toThrow(/transport unit differs/);
    expect(() => adaptPhase9GasPressureIntervention(postInput([{ ...row, transportLexeme: "0", transportValue: 0 }]))).toThrow(/transport domain differs/);
  });

  it("uses a distinct free-fall schema and source-blocks missing ventilation/denominator fields", () => {
    const row = baseRow("phase9-free-fall-ensemble-row-v1", 1, {
      airSpeedMps: null, carrierGas: "air", ensembleDenominator: null, orientation: "unreported",
      outcomeLexeme: "5", outcomeUnit: "um", outcomeValue: 5, outcomeVariable: "mean_a_axis_length",
      pressurePa: 100000, reynoldsNumber: null, sourceOrderSpan: { high: 6, low: 4 },
    });
    const adapted = adaptPhase9FreeFallEnsemble(postInput([row]));
    expect(adapted.status).toBe("source-blocked");
    expect(adapted.reasons.join(" ")).toMatch(/air speed and Reynolds number/);
    expect(() => adaptPhase9GasPressureIntervention(postInput([row]))).toThrow(/keys differ|schema/);
  });

  it("rejects spatial physical duplicates and preserves parsed lexical values", () => {
    const row = baseRow("phase9-spatial-roughness-row-v1", 1, {
      observable: "surface-roughness", positionLexeme: "2.0", positionUnit: "um", positionValue: 2,
      state: "rough", timeLexeme: "0", timeValue: 0, valueLexeme: "0.10", valueUnit: "1", valueValue: 0.1,
    });
    const adapted = adaptPhase9SpatialRoughness(postInput([row]));
    expect(adapted.status).toBe("source-blocked");
    expect(adapted.observations[0]?.values.value).toEqual({ sourceLexeme: "0.10", value: 0.1 });
    const second = { ...row, sourceOrdinal: 2, sourceRowId: "row-2" };
    expect(() => adaptPhase9SpatialRoughness(postInput([row, second]))).toThrow(/duplicates a physical target/);
  });

  it("requires nonnegative sublimation time and claim-specific negative-drive/rate semantics", () => {
    const negativeTime = baseRow("phase9-sublimation-row-v1", 1, {
      claimPurpose: "sublimation-rate", driveLexeme: "-0.02", driveValue: -0.02,
      rateLexeme: "-0.1", rateValue: -0.1, timeLexeme: "-1", timeValue: -1,
    });
    expect(() => adaptPhase9Sublimation(postInput([negativeTime]))).toThrow(/time domain differs/);

    const wrongDrive = baseRow("phase9-sublimation-row-v1", 1, {
      claimPurpose: "sublimation-rate", driveLexeme: "0.02", driveValue: 0.02,
      rateLexeme: "-0.1", rateValue: -0.1, timeLexeme: "0", timeValue: 0,
    });
    expect(adaptPhase9Sublimation(postInput([wrongDrive])).status).toBe("ineligible");

    const matched = baseRow("phase9-sublimation-row-v1", 1, {
      claimPurpose: "sublimation-rate", driveLexeme: "-0.02", driveValue: -0.02,
      rateLexeme: "-0.1", rateValue: -0.1, timeLexeme: "0", timeValue: 0,
    });
    expect(adaptPhase9Sublimation(postInput([matched])).status).toBe("source-blocked");
  });

  it("rejects post-source identity, canonical-form, ordinal, and row-ID mutations", () => {
    const row = baseRow("phase9-categorical-intervention-row-v1", 1, {
      denominator: 10, groupLabel: "treated", intervention: "preactivation", outcomeCount: 4,
    });
    expect(() => adaptPhase9CategoricalIntervention(postInput([{ ...row, selectionId: "WRONG" }]))).toThrow(/identity differs/);
    expect(() => adaptPhase9CategoricalIntervention(postInput([{ ...row, sourceOrdinal: 2 }]))).toThrow(/source order differs/);
    const duplicateId = { ...row, sourceOrdinal: 2 };
    expect(() => adaptPhase9CategoricalIntervention(postInput([row, duplicateId]))).toThrow(/duplicates row ID/);

    const canonicalBytes = jsonl([row]);
    const noncanonical = encoder.encode(` ${decoder.decode(canonicalBytes)}`);
    const input = postInput([row]);
    const selfBoundNoncanonical: Phase9PostPhase8SourceInput = {
      ...input,
      binding: { ...input.binding, descriptor: { ...input.binding.descriptor, byteLength: noncanonical.byteLength, sha256: sha256Bytes(noncanonical) } },
      sourceBytes: noncanonical,
    };
    expect(() => adaptPhase9CategoricalIntervention(selfBoundNoncanonical)).toThrow(/not canonical JSON|not JSON/);
  });
});
