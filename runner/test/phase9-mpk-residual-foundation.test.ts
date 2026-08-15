import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  PHASE9_MPK_REFUSAL_CODES,
  PHASE9_MPK_SERIES,
  phase9MpkPrepareSourceReplay,
  type Phase9MpkReplayPreparationInput,
  type Phase9MpkSeriesId,
  type Phase9MpkSourceRow,
} from "../src/phase9-mpk-residual-foundation.ts";
import {
  verifyPhase9MpkFoundation,
  type Phase9MpkFoundationVerificationInputs,
} from "../src/phase9-mpk-residual-verify.ts";
import { detectPhase9NasRoot, resolvePhase9NasFile } from "../src/phase9-nas.ts";

type JsonRecord = Record<string, unknown>;

const paths = {
  protocol: "research/phase9-mpk-residual-protocol-v1.json",
  shelf: "evidence/phase9-source-overlay-v1/shelf-freeze.json",
  adapters: "research/phase9-adapter-registry-v1.jsonl",
  successor: "evidence/phase8b-benchmark-final-v1/successor-target-book.jsonl",
  metadata: "evidence/phase8b-plot-digitization-v3/records.jsonl",
  mgpProtocol: "research/phase9-mgp-intake-protocol-v1.json",
  mgpRegistry: "research/phase9-mgp-development-registry-v1.jsonl",
  mfProtocol: "research/phase9-mf-mk2-protocol-v1.json",
} as const;
const phase9NasRoot = detectPhase9NasRoot();

function bytes(path: string): Uint8Array {
  return new Uint8Array(readFileSync(path));
}

function inputs(): Phase9MpkFoundationVerificationInputs {
  return {
    protocolBytes: bytes(paths.protocol),
    shelfFreezeBytes: bytes(paths.shelf),
    adapterRegistryBytes: bytes(paths.adapters),
    successorBytes: bytes(paths.successor),
    plotMetadataBytes: bytes(paths.metadata),
    mgpProtocolBytes: bytes(paths.mgpProtocol),
    mgpRegistryBytes: bytes(paths.mgpRegistry),
    mfProtocolBytes: bytes(paths.mfProtocol),
  };
}

function protocol(value: Phase9MpkFoundationVerificationInputs): JsonRecord {
  return JSON.parse(new TextDecoder().decode(value.protocolBytes)) as JsonRecord;
}

function protocolBytes(value: JsonRecord): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value, null, 2)}\n`);
}

function coherentlyRepin(
  value: Phase9MpkFoundationVerificationInputs,
  mutate: (protocolValue: JsonRecord) => void,
): Phase9MpkFoundationVerificationInputs {
  const changed = protocol(value);
  for (const [key, inputKey] of [
    ["s0bShelfFreeze", "shelfFreezeBytes"], ["s1AdapterRegistry", "adapterRegistryBytes"],
    ["phase8Successor", "successorBytes"], ["phase8PlotMetadata", "plotMetadataBytes"],
    ["mgpProtocol", "mgpProtocolBytes"], ["mgpRegistry", "mgpRegistryBytes"],
    ["mfProtocol", "mfProtocolBytes"],
  ] as const) {
    const binding = (changed.upstreamBindings as JsonRecord)[key] as JsonRecord;
    const artifact = value[inputKey];
    binding.byteLength = artifact.byteLength;
    binding.sha256 = createHash("sha256").update(artifact).digest("hex");
  }
  mutate(changed);
  return { ...value, protocolBytes: protocolBytes(changed) };
}

function registration(selectionId: Phase9MpkSeriesId) {
  const value = PHASE9_MPK_SERIES.find((row) => row.selectionId === selectionId);
  if (value === undefined) throw new Error("missing test registration");
  return value;
}

function fixtureRows(selectionId: Phase9MpkSeriesId): Phase9MpkSourceRow[] {
  const registered = registration(selectionId);
  return Array.from({ length: registered.rowCount }, (_unused, index) => {
    const time = index * 10;
    const measured = index + 1;
    return {
      schema: "phase8b-plot-point-v1",
      selectionId,
      pointId: `p${String(index + 1).padStart(3, "0")}`,
      sourceLocator: registered.sourceLocator,
      sourceStatus: "direct-observation",
      phase9EvidenceRole: "model-development",
      expectedPointCount: registered.rowCount,
      operator: "phase8b-adjudicated-plot-digitization-v3",
      adjudicationStatus: "synthetic-fixture",
      adjudication: {},
      digitizationUncertainty: {},
      preReadRefusal: {},
      sourceUncertainty: {},
      x: {
        digitizationLower: time - 0.25,
        digitizationUpper: time + 0.25,
        unit: "s",
        value: time,
        variable: "growth_time",
      },
      y: {
        digitizationLower: measured - 0.25,
        digitizationUpper: measured + 0.25,
        unit: "um",
        value: measured,
        variable: registered.plottedVariable,
      },
    };
  });
}

function verifiedNasRows(selectionId: Phase9MpkSeriesId, nasRoot: string): Phase9MpkSourceRow[] {
  const registered = registration(selectionId);
  const logicalPath = `${registered.rowArtifact.logicalRoot}/${registered.rowArtifact.path}`;
  const resolution = resolvePhase9NasFile(logicalPath, nasRoot);
  if (resolution.kind !== "ok") throw new Error(`source row artifact ${resolution.kind}`);
  const artifact = readFileSync(resolution.path);
  expect(artifact.byteLength).toBe(registered.rowArtifact.byteLength);
  expect(createHash("sha256").update(artifact).digest("hex")).toBe(registered.rowArtifact.sha256);
  return artifact.toString("utf8").trimEnd().split("\n")
    .map((line) => JSON.parse(line) as Phase9MpkSourceRow);
}

function replayInput(
  selectionId: Phase9MpkSeriesId,
  rows: Phase9MpkSourceRow[] = fixtureRows(selectionId),
): Phase9MpkReplayPreparationInput {
  const registered = registration(selectionId);
  return {
    purpose: "exact-one-bar-source-replay-preparation",
    selectionId,
    sourceArtifactSha256: "909cdb8504d9cfc72f70363436e5c796b99c7e107cab4331051e446255fc8ed4",
    airPressureBar: 1,
    support: "substrate-grown-needle",
    geometry: "supported-individual-needle",
    transferModel: "unavailable",
    arbitraryHeightOffsetPolicy: registered.heightOffsetPolicy,
    rows,
  };
}

describe("Phase 9 M-PK residual eligibility/refusal foundation", () => {
  it("verifies exact authorities and returns no score or promotion", () => {
    expect(verifyPhase9MpkFoundation(inputs())).toEqual({
      ok: true,
      protocolId: "phase9-mpk-residual-source-replay-foundation-v1",
      sourceSeriesCount: 4,
      sourcePointCount: 78,
      aggregateGasPressureConstraintCount: 26,
      sourceDataScoresProduced: 0,
      modelScoresProduced: 0,
      surfaceKineticsResidualAvailable: false,
      threeDimensionalReplayAuthorized: false,
      promotionAuthorized: false,
      grantsValidationClaim: false,
    });
  });

  it("prepares all four registered row-envelope fixtures while refusing every stronger use", () => {
    for (const registered of PHASE9_MPK_SERIES) {
      const result = phase9MpkPrepareSourceReplay(replayInput(registered.selectionId));
      expect(result.sourceRowCount).toBe(registered.rowCount);
      expect(result.refusalCodes).toEqual(PHASE9_MPK_REFUSAL_CODES);
      expect(result).toMatchObject({
        status: "source-replay-prepared-residual-refused",
        aggregateGasPressureConstraintCount: 26,
        aggregateGasPressureConstraintStatus: "transport-confounded-no-cross-pressure-score",
        sourceDataScoreProduced: false,
        modelScoreProduced: false,
        surfaceKineticsResidualProduced: false,
        threeDimensionalReplayExecuted: false,
        promotionAuthorized: false,
        grantsValidationClaim: false,
      });
    }
  });

  it.skipIf(phase9NasRoot === null)(
    "rehashes and accepts the frozen NAS row artifacts when the share is attached",
    () => {
      if (phase9NasRoot === null) throw new Error("Phase 9 NAS is not attached");
      for (const registered of PHASE9_MPK_SERIES) {
        const rows = verifiedNasRows(registered.selectionId, phase9NasRoot);
        const result = phase9MpkPrepareSourceReplay(replayInput(registered.selectionId, rows));
        expect(result.sourceRowCount).toBe(registered.rowCount);
        expect(result.refusalCodes).toEqual(PHASE9_MPK_REFUSAL_CODES);
      }
    },
  );

  it("rejects offset invention, sparse rows, row substitution, and unknown claim fields", () => {
    const base = replayInput("P8B-P1-L16-F4-H");
    expect(() => phase9MpkPrepareSourceReplay({
      ...base,
      arbitraryHeightOffsetPolicy: "not-applicable",
    })).toThrow(/offset policy differs/u);
    const sparse = [...base.rows];
    delete sparse[0];
    expect(() => phase9MpkPrepareSourceReplay({ ...base, rows: sparse })).toThrow(/dense/u);
    const claimBearingRows = [...base.rows];
    Object.defineProperty(claimBearingRows, "validationClaimAuthorized", {
      configurable: true,
      enumerable: true,
      value: true,
    });
    expect(() => phase9MpkPrepareSourceReplay({ ...base, rows: claimBearingRows }))
      .toThrow(/exact dense array own properties/u);
    const replaced = structuredClone(base.rows) as Phase9MpkSourceRow[];
    replaced[0] = { ...replaced[0]!, pointId: "p999" };
    expect(() => phase9MpkPrepareSourceReplay({ ...base, rows: replaced })).toThrow(/identity or provenance/u);
    expect(() => phase9MpkPrepareSourceReplay({
      ...base,
      validationClaimAuthorized: true,
    } as Phase9MpkReplayPreparationInput)).toThrow(/key set differs/u);
  });

  it("rejects coherent-repin claim, source, roster, and M-GP meaning forgeries", () => {
    const base = inputs();
    const forgeries = [
      (value: JsonRecord) => { value.validationClaimAuthorized = true; },
      (value: JsonRecord) => { (value.state as JsonRecord).grantsValidationClaim = true; },
      (value: JsonRecord) => { (value.sourceBinding as JsonRecord).sha256 = "0".repeat(64); },
      (value: JsonRecord) => {
        ((value.seriesRoster as JsonRecord[])[0] as JsonRecord).rowCount = 17;
      },
      (value: JsonRecord) => {
        (value.mgpConstraint as JsonRecord).meaning = "surface residual identified";
      },
    ];
    for (const mutate of forgeries) {
      expect(() => verifyPhase9MpkFoundation(coherentlyRepin(base, mutate))).toThrow();
    }
  });
});
