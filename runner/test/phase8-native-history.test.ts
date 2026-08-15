import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalJson, sha256Bytes } from "../src/gate4-evidence.ts";
import {
  PHASE8_NATIVE_IMPLEMENTATION_PATHS,
  derivePhase8NativeBundle,
  writePhase8NativeDirectory,
  type Phase8NativeInputs,
  type Phase8NativeRegistration,
} from "../src/phase8-native-history.ts";
import {
  readPhase8NativePublishedDirectory,
  verifyPhase8NativePublication,
  type Phase8NativeVerifyInputs,
} from "../src/phase8-native-history-verify.ts";

const encoder = new TextEncoder();
const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop() as string, { recursive: true, force: true });
  }
});

function bytes(text: string): Uint8Array {
  return encoder.encode(text);
}

function crc32(value: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  readonly name: string;
  readonly value?: Uint8Array;
}

function storedZip(entries: readonly ZipEntry[]): Uint8Array {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const value = Buffer.from(entry.value ?? new Uint8Array());
    const declaredCrc = crc32(value);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(declaredCrc, 14);
    local.writeUInt32LE(value.length, 18);
    local.writeUInt32LE(value.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, value);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(declaredCrc, 16);
    central.writeUInt32LE(value.length, 20);
    central.writeUInt32LE(value.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(entry.name.endsWith("/") ? 0x41ed0000 : 0x81a40000, 38);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + value.length;
  }
  const localBytes = Buffer.concat(localParts);
  const centralBytes = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(localBytes.length, 16);
  return new Uint8Array(Buffer.concat([localBytes, centralBytes, eocd]));
}

const MASS_ROOT = "fixture-harrison-root";
const DIMENSION_ROOT = "fixture-dimension-root";
const MASS_MEMBER = "mass.dat";
const EXCLUDED_MEMBER = "heticegrowth_625.dat";
const DIMENSION_MEMBER = "dimensions-20240814.dat";
const DEFAULT_MASS =
  "  1.0000e+00  2.0000e+00  0.0000e+00  4.0000e+00  1.0000000e+00  9.1111e+00\n" +
  "  1.1000e+00  2.1000e+00  0.0000e+00  4.1000e+00  9.9000000e-01  9.2222e+00\n" +
  "  1.2000e+00  2.2000e+00  1.0000e+00  4.2000e+00  1.1000000e+00  9.3333e+00\n";
const DIMENSION_HEADER =
  "Experiment 2024/08/14\n" +
  "Temperature: -50C\n" +
  "Supersaturation: 48%, switch to 20% at 230 min\n" +
  "Pressure: 972 hPa\n\n" +
  "Columns:   time (sec) dimensions (micron)\n" +
  "time, a, c, Delta a min, Delta c min, Delta a max, Delta c max, ring width, Delta ring min, Delta ring max\n";
const DEFAULT_DIMENSIONS = DIMENSION_HEADER +
  "13504.00 51.50 174.54 0.40 5.00 1.53 10.01 6.37 0.70 1.49\n" +
  "13804.00 51.70 176.07 0.41 5.10 1.45 9.97 7.87 0.71 1.64\n" +
  "14104.00 51.33 176.97 0.42 5.20 1.84 10.64 13.81 0.72 2.61\n";

interface Fixture {
  readonly producerInputs: Phase8NativeInputs;
  readonly verificationBase: Omit<Phase8NativeVerifyInputs, "published">;
  readonly registration: Phase8NativeRegistration;
  readonly massBytes: Uint8Array;
  readonly dimensionBytes: Uint8Array;
}

function fixture(overrides: { readonly massText?: string; readonly dimensionText?: string } = {}): Fixture {
  const massBytes = bytes(overrides.massText ?? DEFAULT_MASS);
  const dimensionBytes = bytes(overrides.dimensionText ?? DEFAULT_DIMENSIONS);
  const excludedBytes = bytes("excluded provenance fixture\n");
  const harrisonArchiveBytes = storedZip([
    { name: `${MASS_ROOT}/` },
    { name: `${MASS_ROOT}/${MASS_MEMBER}`, value: massBytes },
    { name: `${MASS_ROOT}/${EXCLUDED_MEMBER}`, value: excludedBytes },
  ]);
  const dimensionArchiveBytes = storedZip([
    { name: `${DIMENSION_ROOT}/` },
    { name: `${DIMENSION_ROOT}/${DIMENSION_MEMBER}`, value: dimensionBytes },
  ]);
  const massRowCount = (overrides.massText ?? DEFAULT_MASS).trimEnd().split("\n").length;
  const dimensionRowCount = (overrides.dimensionText ?? DEFAULT_DIMENSIONS).trimEnd().split("\n").length - 7;
  const registration: Phase8NativeRegistration = {
    scope: "test-fixture",
    dataLogicalRoot: "research-cache/test-native-history",
    harrisonArchive: {
      fileName: "fixture-harrison.zip",
      byteLength: harrisonArchiveBytes.byteLength,
      sha256: sha256Bytes(harrisonArchiveBytes),
      regularMemberCount: 2,
      memberRoot: MASS_ROOT,
    },
    dimensionArchive: {
      fileName: "fixture-dimensions.zip",
      byteLength: dimensionArchiveBytes.byteLength,
      sha256: sha256Bytes(dimensionArchiveBytes),
      regularMemberCount: 1,
      memberRoot: DIMENSION_ROOT,
    },
    massHistories: [{
      runId: "fixture-mass",
      sourceUnitId: "P8B-UNIT-FIXTURE-MASS",
      memberName: MASS_MEMBER,
      byteLength: massBytes.byteLength,
      sha256: sha256Bytes(massBytes),
      rowCount: massRowCount,
    }],
    dimensionHistories: [{
      runId: "20240814",
      sourceUnitId: "P8B-UNIT-FIXTURE-DIMENSIONS",
      memberName: DIMENSION_MEMBER,
      byteLength: dimensionBytes.byteLength,
      sha256: sha256Bytes(dimensionBytes),
      rowCount: dimensionRowCount,
      experimentHeader: "Experiment 2024/08/14",
      temperatureHeader: "Temperature: -50C",
      supersaturationHeader: "Supersaturation: 48%, switch to 20% at 230 min",
      pressureHeader: "Pressure: 972 hPa",
      tempC: -50,
      pressureHpa: 972,
      initialSupersaturationPercent: 48,
      forcingEvent: {
        atSeconds: 13_800,
        supersaturationPercent: 20,
        previousRowTimeLexeme: "13504.00",
        nextRowTimeLexeme: "13804.00",
      },
    }],
    excludedMassMember: {
      memberName: EXCLUDED_MEMBER,
      byteLength: excludedBytes.byteLength,
      sha256: sha256Bytes(excludedBytes),
    },
    requiredAbsentConditionFragment: "fixture unmatched condition",
    expectedTotals: {
      historyCount: 2,
      massHistoryCount: 1,
      dimensionHistoryCount: 1,
      rowCount: massRowCount + dimensionRowCount,
      selectedSourceMemberBytes: massBytes.byteLength + dimensionBytes.byteLength,
    },
  };
  const lock = {
    schema: "phase6-heldout-candidate-lock-v1",
    sources: {
      harrison2016Archive: {
        fileName: registration.harrisonArchive.fileName,
        byteLength: registration.harrisonArchive.byteLength,
        sha256: registration.harrisonArchive.sha256,
      },
    },
    harrisonCandidate: {
      status: "source-locked-not-scoreable",
      extraction: {
        columns: 6,
        timeColumnZeroBased: 2,
        massRatioColumnZeroBased: 4,
        requireNondecreasingTime: true,
        requirePositiveMassRatio: true,
      },
      excludedMembers: [{
        name: EXCLUDED_MEMBER,
        byteLength: excludedBytes.byteLength,
        sha256: sha256Bytes(excludedBytes),
      }],
      requiredAbsence: [{ condition: "fixture unmatched condition" }],
      traces: [{
        id: "fixture-mass",
        member: MASS_MEMBER,
        byteLength: massBytes.byteLength,
        sha256: sha256Bytes(massBytes),
        pressurePa: 97_000,
        tempC: -32,
        tempRangeC: 0.1,
        sigmaIcePercent: 7.5,
        sigmaIceRangePercent: 0.7,
        initialRadiusUm: 9.6,
        initialRadiusRangeUm: 0.3,
      }],
    },
  };
  const conditionLockBytes = bytes(`${JSON.stringify(lock)}\n`);
  const selectionBytes = bytes(`${[
    {
      id: "P8B-P0-FIXTURE-MASS",
      measurementFamily: "mass-ratio-history",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
      phase9EvidenceRole: "model-development",
      priorityClass: "P0",
      recordKind: "benchmark-selection",
      schema: "phase8b-benchmark-selection-v1",
      selectionBasis: "fixture",
      source: {
        containerId: "P8B-CONT-FIXTURE-HARRISON",
        locator: `zip-member:${MASS_ROOT}/${MASS_MEMBER}`,
        sourceUnitId: "P8B-UNIT-FIXTURE-MASS",
      },
      targetBookAnchors: ["P8-T-FIXTURE-MASS"],
    },
    {
      id: "P8B-P0-FIXTURE-DIMENSIONS",
      measurementFamily: "dimension-history",
      numericTargetCoordinatesExtractedBeforeSelection: false,
      outcomeValueUsedAsSelectionCriterion: false,
      phase9EvidenceRole: "model-development",
      priorityClass: "P0",
      recordKind: "benchmark-selection",
      schema: "phase8b-benchmark-selection-v1",
      selectionBasis: "fixture",
      source: {
        containerId: "P8B-CONT-FIXTURE-DIMENSIONS",
        locator: `zip-member:${DIMENSION_ROOT}/${DIMENSION_MEMBER}`,
        sourceUnitId: "P8B-UNIT-FIXTURE-DIMENSIONS",
      },
      targetBookAnchors: ["P8-T-FIXTURE-DIMENSIONS"],
    },
  ].map((record) => canonicalJson(record)).join("\n")}\n`);
  const implementation = new Map<string, Uint8Array>();
  for (const path of PHASE8_NATIVE_IMPLEMENTATION_PATHS) {
    implementation.set(path, bytes(`fixture implementation: ${path}\n`));
  }
  return {
    registration,
    massBytes,
    dimensionBytes,
    producerInputs: {
      registration,
      harrisonArchiveBytes,
      dimensionArchiveBytes,
      conditionLockBytes,
      selectionBytes,
      implementation,
    },
    verificationBase: {
      registration,
      harrisonArchiveBytes,
      dimensionArchiveBytes,
      conditionLockBytes,
      selectionBytes,
      implementation,
      mirrors: new Map([
        [`${MASS_ROOT}/${MASS_MEMBER}`, massBytes],
        [`${MASS_ROOT}/${EXCLUDED_MEMBER}`, excludedBytes],
        [`${DIMENSION_ROOT}/${DIMENSION_MEMBER}`, dimensionBytes],
      ]),
    },
  };
}

function publishedFrom(bundle: ReturnType<typeof derivePhase8NativeBundle>) {
  return { metadataArtifacts: bundle.metadataArtifacts, dataArtifacts: bundle.dataArtifacts };
}

describe("Phase 8B native full-history producer", () => {
  it("preserves every selected source lexeme and leaves duplicate/decreasing mass rows raw", () => {
    const input = fixture();
    const bundle = derivePhase8NativeBundle(input.producerInputs);
    expect(bundle.counts).toEqual({
      historyCount: 2,
      massHistoryCount: 1,
      dimensionHistoryCount: 1,
      rowCount: 6,
      selectedSourceMemberBytes: input.massBytes.byteLength + input.dimensionBytes.byteLength,
      normalizedDataBytes: [...bundle.dataArtifacts.values()].reduce((sum, value) => sum + value.byteLength, 0),
    });
    expect(new TextDecoder().decode(bundle.dataArtifacts.get("data/mass-ratio-fixture-mass.tsv"))).toBe(
      "sourceRowIndex\ttime_s\tmass_ratio\n" +
      "1\t0.0000e+00\t1.0000000e+00\n" +
      "2\t0.0000e+00\t9.9000000e-01\n" +
      "3\t1.0000e+00\t1.1000000e+00\n",
    );
    expect(new TextDecoder().decode(bundle.dataArtifacts.get("data/dimensions-20240814.tsv"))).toContain(
      "1\t13504.00\t51.50\t174.54\t0.40\t5.00\t1.53\t10.01\t6.37\t0.70\t1.49\n",
    );
    const records = new TextDecoder().decode(bundle.metadataArtifacts.get("records.jsonl"))
      .trimEnd().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
    const mass = records.find((record) => record.historyKind === "mass-ratio") as Record<string, unknown>;
    expect(mass.timeFacts).toMatchObject({
      uniqueTimeCount: 2,
      adjacentRepeatedTimeCount: 1,
      maximumTimeMultiplicity: 2,
      adjacentMassDecreaseCount: 1,
      coalesced: false,
      smoothed: false,
    });
    expect(mass.excludedSourceColumn).toMatchObject({ zeroBased: 5 });
    const dimensions = records.find((record) => record.historyKind === "dimensions") as Record<string, unknown>;
    expect(dimensions.conditions).toMatchObject({
      supersaturationSemanticStatus: "source-relative basis unresolved; not a model input",
      forcingEvent: {
        atSeconds: 13_800,
        previousRowTimeLexeme: "13504.00",
        nextRowTimeLexeme: "13804.00",
      },
    });
  });

  it("refuses decreasing time, nonpositive mass, and a changed dimension header", () => {
    const decreasingTime = DEFAULT_MASS.replace("  1.0000e+00  4.2000e+00", " -1.0000e+00  4.2000e+00");
    expect(() => derivePhase8NativeBundle(fixture({ massText: decreasingTime }).producerInputs)).toThrow(/time is negative or decreases/);
    const zeroMass = DEFAULT_MASS.replace("9.9000000e-01", "0.0000000e+00");
    expect(() => derivePhase8NativeBundle(fixture({ massText: zeroMass }).producerInputs)).toThrow(/mass ratio is not positive/);
    const changedHeader = DEFAULT_DIMENSIONS.replace("Pressure: 972 hPa", "Pressure: 971 hPa");
    expect(() => derivePhase8NativeBundle(fixture({ dimensionText: changedHeader }).producerInputs)).toThrow(/seven-line source header differs/);
  });

  it("publishes atomically once and refuses overwrite", () => {
    const input = fixture();
    const bundle = derivePhase8NativeBundle(input.producerInputs);
    const root = mkdtempSync(join(tmpdir(), "phase8-native-"));
    temporaryRoots.push(root);
    const destination = join(root, "candidate");
    writePhase8NativeDirectory(destination, bundle);
    const reopened = readPhase8NativePublishedDirectory(destination);
    expect([...reopened.metadataArtifacts.keys()].sort()).toEqual([
      "artifact-index.json", "operator.json", "records.jsonl", "report.json",
    ]);
    expect(reopened.dataArtifacts.size).toBe(2);
    expect(() => writePhase8NativeDirectory(destination, bundle)).toThrow(/refusing to overwrite/);
  });

  it("binds the frozen P0 selection roster and refuses registered row bodies inside the repository", () => {
    const input = fixture();
    const changedSelection = bytes(
      new TextDecoder().decode(input.producerInputs.selectionBytes)
        .replace("P8B-UNIT-FIXTURE-MASS", "P8B-UNIT-FIXTURE-OTHER"),
    );
    expect(() => derivePhase8NativeBundle({
      ...input.producerInputs,
      selectionBytes: changedSelection,
    })).toThrow(/P0 selection unit\/locator roster differs/);

    const bundle = derivePhase8NativeBundle(input.producerInputs);
    const registered = { ...bundle, scope: "registered-20260812" as const };
    expect(() => writePhase8NativeDirectory(
      join(process.cwd(), "would-be-native-row-publication"),
      registered,
      { repositoryRoot: process.cwd() },
    )).toThrow(/inside the repository/);
  });
});

describe("Phase 8B native full-history independent verifier", () => {
  it("reconstructs every row from expanded mirrors and verifies the metadata graph", () => {
    const input = fixture();
    const bundle = derivePhase8NativeBundle(input.producerInputs);
    const result = verifyPhase8NativePublication({
      ...input.verificationBase,
      published: publishedFrom(bundle),
    });
    expect(result).toMatchObject({
      ok: true,
      historyCount: 2,
      rowCount: 6,
      sourceLexemeRowsCompared: 6,
      archiveCountHashed: 2,
      mirrorCountHashed: 3,
    });
  });

  it("refuses a changed normalized lexeme, mirror byte, record, and incomplete data set", () => {
    const input = fixture();
    const bundle = derivePhase8NativeBundle(input.producerInputs);

    const changedData = new Map(bundle.dataArtifacts);
    const massPath = "data/mass-ratio-fixture-mass.tsv";
    changedData.set(massPath, bytes(new TextDecoder().decode(changedData.get(massPath)).replace("9.9000000e-01", "9.8000000e-01")));
    expect(() => verifyPhase8NativePublication({
      ...input.verificationBase,
      published: { metadataArtifacts: bundle.metadataArtifacts, dataArtifacts: changedData },
    })).toThrow(/source lexemes differ/);

    const changedMirrors = new Map(input.verificationBase.mirrors);
    changedMirrors.set(`${MASS_ROOT}/${MASS_MEMBER}`, bytes(DEFAULT_MASS.replace("9.9000000e-01", "9.8000000e-01")));
    expect(() => verifyPhase8NativePublication({
      ...input.verificationBase,
      mirrors: changedMirrors,
      published: publishedFrom(bundle),
    })).toThrow(/byte\/hash pin differs/);

    const changedMetadata = new Map(bundle.metadataArtifacts);
    changedMetadata.set("records.jsonl", bytes(new TextDecoder().decode(changedMetadata.get("records.jsonl")).replace('"sourceRows":3', '"sourceRows":4')));
    expect(() => verifyPhase8NativePublication({
      ...input.verificationBase,
      published: { metadataArtifacts: changedMetadata, dataArtifacts: bundle.dataArtifacts },
    })).toThrow(/sourceRows differs/);

    const incomplete = new Map(bundle.dataArtifacts);
    incomplete.delete(massPath);
    expect(() => verifyPhase8NativePublication({
      ...input.verificationBase,
      published: { metadataArtifacts: bundle.metadataArtifacts, dataArtifacts: incomplete },
    })).toThrow(/data file set differs/);
  });

  it("independently binds selection, excluded 625 bytes, and all published semantics", () => {
    const input = fixture();
    const bundle = derivePhase8NativeBundle(input.producerInputs);
    const changedSelection = bytes(
      new TextDecoder().decode(input.verificationBase.selectionBytes)
        .replace("P8B-UNIT-FIXTURE-MASS", "P8B-UNIT-FIXTURE-OTHER"),
    );
    expect(() => verifyPhase8NativePublication({
      ...input.verificationBase,
      selectionBytes: changedSelection,
      published: publishedFrom(bundle),
    })).toThrow(/P0 selection unit\/locator roster differs/);

    const changedExcluded = new Map(input.verificationBase.mirrors);
    changedExcluded.set(`${MASS_ROOT}/${EXCLUDED_MEMBER}`, bytes("Excluded provenance fixture\n"));
    expect(() => verifyPhase8NativePublication({
      ...input.verificationBase,
      mirrors: changedExcluded,
      published: publishedFrom(bundle),
    })).toThrow(/excluded 625 mirror byte\/hash pin differs/);

    const semanticCases: readonly [string, string, string, RegExp][] = [
      ["records.jsonl", "single-particle mass ratio m/m0 as a function of elapsed time", "changed observable", /observable\/uncertainty\/specimen\/lineage/],
      ["records.jsonl", "not broadly redistributable under identified terms", "changed source-byte rights", /rights boundary differs/],
      ["records.jsonl", "sourceRowIndex\\ttime_s\\tmass_ratio", "sourceRowIndex\\ttime_s\\tchanged", /normalized binding differs/],
      ["operator.json", "preserve raw rows; no coalescing in this operator", "changed duplicate policy", /operator rules or rights boundary differ/],
      ["operator.json", "normalized row bodies remain NAS-local until redistribution rights are resolved", "changed rights boundary", /operator rules or rights boundary differ/],
      ["report.json", "source-reported dimension supersaturation basis remains unresolved and is not a model input", "changed limitation", /report limitations differ/],
    ];
    for (const [name, before, after, refusal] of semanticCases) {
      const metadata = new Map(bundle.metadataArtifacts);
      metadata.set(name, bytes(new TextDecoder().decode(metadata.get(name)).replace(before, after)));
      expect(() => verifyPhase8NativePublication({
        ...input.verificationBase,
        published: { metadataArtifacts: metadata, dataArtifacts: bundle.dataArtifacts },
      }), `${name}: ${before}`).toThrow(refusal);
    }
  });

  it("has no producer import and therefore cannot inherit its parser implementation", () => {
    const source = readFileSync("runner/src/phase8-native-history-verify.ts", "utf8");
    expect(source).not.toMatch(/from\s+["']\.\/phase8-native-history\.ts["']/);
    expect(source).toContain("independentlyParseMass");
    expect(source).toContain("independentlyParseDimension");
  });
});
