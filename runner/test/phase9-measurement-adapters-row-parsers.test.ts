import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { canonicalJson } from "../src/gate4-evidence.ts";

const encoder = new TextEncoder();
const sourcePath = join(import.meta.dirname, "../src/phase9-measurement-adapters.ts");
const gate4Path = resolve(import.meta.dirname, "../src/gate4-evidence.ts");
const expectedSourceSha256 = "f3298052fdac1fac062fe789fc45fea7c886dfcf3c27bc0ba9166335a7f47f9b";
const sourceBytes = readFileSync(sourcePath);
const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");

interface SyntheticPointer {
  readonly selectionId: string;
  readonly metadataRecordId: string;
  readonly sourceUnitId: string | null;
}

interface SyntheticAdapter {
  readonly adapterKind: "free-particle-mass" | "supported-dimension-rim" | "planar-facet";
  readonly bindingKind: "native-history" | "digitized-plot-series";
}

interface AdaptedObservation {
  readonly sourceOrdinal: number;
  readonly sourceRowIndexLexeme: string | null;
  readonly sourceLine: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly uncertainty: Readonly<Record<string, unknown>>;
}

interface AdaptedResult {
  readonly status: string;
  readonly reasons: readonly string[];
  readonly observations: readonly AdaptedObservation[];
}

interface InstrumentedParsers {
  readonly parseNativeMass: (
    pointer: SyntheticPointer,
    adapter: SyntheticAdapter,
    metadata: Readonly<Record<string, unknown>>,
    bytes: Uint8Array,
  ) => AdaptedResult;
  readonly parseNativeDimensions: (
    pointer: SyntheticPointer,
    adapter: SyntheticAdapter,
    metadata: Readonly<Record<string, unknown>>,
    bytes: Uint8Array,
  ) => AdaptedResult;
  readonly parsePlotPointRows: (
    pointer: SyntheticPointer,
    metadata: Readonly<Record<string, unknown>>,
    bytes: Uint8Array,
  ) => readonly AdaptedObservation[];
  readonly parsePlotSeries: (
    pointer: SyntheticPointer,
    adapter: SyntheticAdapter,
    metadata: Readonly<Record<string, unknown>>,
    bytes: Uint8Array,
  ) => AdaptedResult;
}

async function loadPinnedPrivateParsers(): Promise<InstrumentedParsers> {
  if (sourceSha256 !== expectedSourceSha256) {
    throw new Error(`Phase 9 adapter source SHA-256 differs: ${sourceSha256}`);
  }
  const source = sourceBytes.toString("utf8");
  const relativeImport = "from \"./gate4-evidence.ts\";";
  const matches = source.split(relativeImport).length - 1;
  if (matches !== 1) throw new Error(`expected one gate4 import, found ${matches}`);
  const instrumented = `${source.replace(
    relativeImport,
    `from ${JSON.stringify(pathToFileURL(gate4Path).href)};`,
  )}\nexport { parseNativeMass, parseNativeDimensions, parsePlotPointRows, parsePlotSeries };\n`;
  const typescript = await import("typescript");
  const transpiled = typescript.transpileModule(instrumented, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  });
  const errors = (transpiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === typescript.DiagnosticCategory.Error,
  );
  if (errors.length > 0) throw new Error(`instrumented adapter source has ${errors.length} transpile errors`);
  const url = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString("base64")}`;
  return await import(url) as InstrumentedParsers;
}

function textArtifact(lines: readonly string[]): Uint8Array {
  return encoder.encode(`${lines.join("\n")}\n`);
}

const massHeader = "sourceRowIndex\ttime_s\tmass_ratio";
const massPointer: SyntheticPointer = {
  selectionId: "TEST-NATIVE-MASS",
  metadataRecordId: "TEST-NATIVE-MASS-METADATA",
  sourceUnitId: "TEST-NATIVE-MASS-UNIT",
};
const massAdapter: SyntheticAdapter = {
  adapterKind: "free-particle-mass",
  bindingKind: "native-history",
};
const massMetadata = {
  conditions: { apparatus: "synthetic-levitation", temperatureK: 225 },
  developmentRole: "model-development",
  disposition: "included-native-history",
  historyKind: "mass-ratio",
  normalized: { header: massHeader, sourceLexemesPreserved: true },
  uncertainty: { relativeMassRatio: "five-percent-source-statement" },
};

const dimensionHeader = "sourceRowIndex\ttime_s\ta_um\tc_um\ta_error_min_um\tc_error_min_um\ta_error_max_um\tc_error_max_um\trim_width_um\trim_error_min_um\trim_error_max_um";
const dimensionPointer: SyntheticPointer = {
  selectionId: "TEST-NATIVE-DIMENSIONS",
  metadataRecordId: "TEST-NATIVE-DIMENSIONS-METADATA",
  sourceUnitId: "TEST-NATIVE-DIMENSIONS-UNIT",
};
const dimensionAdapter: SyntheticAdapter = {
  adapterKind: "supported-dimension-rim",
  bindingKind: "native-history",
};
const dimensionMetadata = {
  conditions: { apparatus: "synthetic-supported-crystal", temperatureC: -15 },
  developmentRole: "model-development",
  disposition: "included-native-history",
  historyKind: "dimensions",
  normalized: { header: dimensionHeader, sourceLexemesPreserved: true },
  uncertainty: { construction: "source-bounds" },
};

const plotPointer: SyntheticPointer = {
  selectionId: "TEST-PLANAR-PLOT",
  metadataRecordId: "TEST-PLANAR-PLOT",
  sourceUnitId: null,
};
const plotAdapter: SyntheticAdapter = {
  adapterKind: "planar-facet",
  bindingKind: "digitized-plot-series",
};
const plotMetadata = {
  conditions: { facet: "prism", support: "substrate", temperatureC: -15 },
  operator: "phase8b-adjudicated-plot-digitization-v3",
  phase9EvidenceRole: "model-development",
  sourceUncertainty: { denominator: "unreported", dispersion: "unreported" },
};

function plotPoint(ordinal: number): Readonly<Record<string, unknown>> {
  const x = 0.01 * ordinal;
  const y = 0.25 * ordinal;
  return {
    adjudication: { acceptedPixels: { x: 100 + ordinal, y: 200 + ordinal } },
    adjudicationStatus: "accepted-two-reader-adjudication",
    digitizationUncertainty: { construction: "accepted-pixel-interval" },
    phase9EvidenceRole: "model-development",
    pointId: `TEST-POINT-${ordinal}`,
    schema: "phase8b-plot-point-v1",
    selectionId: plotPointer.selectionId,
    sourceOrderSpan: { high: y + 0.02, low: y - 0.02 },
    sourceStatus: "plot-digitized",
    sourceUncertainty: { denominator: "unreported" },
    x: {
      digitizationLower: x - 0.001,
      digitizationUpper: x + 0.001,
      unit: "1",
      value: x,
      variable: "supersaturation",
    },
    y: {
      digitizationLower: y - 0.01,
      digitizationUpper: y + 0.01,
      unit: "um/s",
      value: y,
      variable: "normal_growth_rate",
    },
  };
}

function plotArtifact(rows: readonly Readonly<Record<string, unknown>>[]): Uint8Array {
  return textArtifact(rows.map((row) => canonicalJson(row)));
}

let parsers: InstrumentedParsers;

beforeAll(async () => {
  parsers = await loadPinnedPrivateParsers();
});

describe("Phase 9 registered row parser semantics", () => {
  it("instruments only the exact launch-bound adapter source", () => {
    expect(sourceSha256).toBe(expectedSourceSha256);
  });

  it("parses native mass rows while preserving order, lexemes, and measured decreases", () => {
    const lines = [massHeader, "1\t0.0\t1.00", "2\t1.0\t0.95", "3\t1.0\t1.10"];
    const adapted = parsers.parseNativeMass(massPointer, massAdapter, massMetadata, textArtifact(lines));

    expect(adapted.status).toBe("eligible-with-limitation");
    expect(adapted.observations).toHaveLength(3);
    expect(adapted.observations.map((row) => row.sourceOrdinal)).toEqual([1, 2, 3]);
    expect(adapted.observations[1]?.sourceLine).toBe(lines[2]);
    expect(adapted.observations[1]?.values.massRatio).toEqual({ sourceLexeme: "0.95", value: 0.95 });
    expect((adapted.observations[1]?.values.massRatio as { value: number }).value).toBeLessThan(
      (adapted.observations[0]?.values.massRatio as { value: number }).value,
    );
  });

  it("rejects a native mass header mutation at parser semantics", () => {
    const mutatedHeader = massHeader.replace("mass_ratio", "mass_fraction");
    const bytes = textArtifact([mutatedHeader, "1\t0\t1"]);
    expect(new TextDecoder().decode(bytes).split("\n")[0]).toBe(mutatedHeader);
    expect(mutatedHeader).not.toBe(massHeader);

    expect(() => parsers.parseNativeMass(massPointer, massAdapter, massMetadata, bytes)).toThrow(/native mass header\/body differs/);
  });

  it("rejects decreasing native mass time after independently confirming the mutation", () => {
    const lines = [massHeader, "1\t0\t1", "2\t2\t0.9", "3\t1\t0.8"];
    const times = lines.slice(1).map((line) => Number(line.split("\t")[1]));
    expect(times).toEqual([0, 2, 1]);
    expect(times[2]).toBeLessThan(times[1] as number);

    expect(() => parsers.parseNativeMass(massPointer, massAdapter, massMetadata, textArtifact(lines))).toThrow(/native mass row 3 domain differs/);
  });

  it("rejects a nonpositive native mass ratio after independently confirming the mutation", () => {
    const lines = [massHeader, "1\t0\t1", "2\t1\t0"];
    const mutatedMass = Number((lines[2] as string).split("\t")[2]);
    expect(mutatedMass).toBeLessThanOrEqual(0);

    expect(() => parsers.parseNativeMass(massPointer, massAdapter, massMetadata, textArtifact(lines))).toThrow(/native mass row 2 domain differs/);
  });

  it("parses native dimension/rim rows while preserving lexical values and uncertainty", () => {
    const lines = [
      dimensionHeader,
      "1\t0.0\t10.0\t5.0\t9.5\t4.8\t10.5\t5.2\t1.00\t0.80\t1.20",
      "2\t10.0\t12.0\t5.5\t11.4\t5.2\t12.6\t5.8\t1.50\t1.20\t1.80",
    ];
    const adapted = parsers.parseNativeDimensions(
      dimensionPointer,
      dimensionAdapter,
      dimensionMetadata,
      textArtifact(lines),
    );

    expect(adapted.status).toBe("eligible-with-limitation");
    expect(adapted.observations).toHaveLength(2);
    expect(adapted.observations[1]?.values.rimWidthUm).toEqual({ sourceLexeme: "1.50", value: 1.5 });
    expect(adapted.observations[0]?.uncertainty).toEqual({ construction: "source-bounds" });
    expect(adapted.observations.map((row) => row.sourceRowIndexLexeme)).toEqual(["1", "2"]);
  });

  it("rejects a negative native rim width after independently confirming the mutation", () => {
    const lines = [
      dimensionHeader,
      "1\t0\t10\t5\t9.5\t4.8\t10.5\t5.2\t1\t0.8\t1.2",
      "2\t10\t12\t5.5\t11.4\t5.2\t12.6\t5.8\t-0.01\t0\t0.2",
    ];
    const mutatedRimWidth = Number((lines[2] as string).split("\t")[8]);
    expect(mutatedRimWidth).toBeLessThan(0);

    expect(() => parsers.parseNativeDimensions(
      dimensionPointer,
      dimensionAdapter,
      dimensionMetadata,
      textArtifact(lines),
    )).toThrow(/native dimension row 2 domain differs/);
  });

  it("parses plot rows and the registered planar series without discarding uncertainty", () => {
    const rows = [plotPoint(1), plotPoint(2)];
    const bytes = plotArtifact(rows);
    const parsedRows = parsers.parsePlotPointRows(plotPointer, plotMetadata, bytes);
    const adapted = parsers.parsePlotSeries(plotPointer, plotAdapter, plotMetadata, bytes);

    expect(parsedRows).toHaveLength(2);
    expect(parsedRows[0]?.sourceLine).toBe(canonicalJson(rows[0]));
    expect(parsedRows[0]?.uncertainty).toEqual({
      digitization: { construction: "accepted-pixel-interval" },
      source: { denominator: "unreported" },
    });
    expect(adapted.status).toBe("eligible-with-limitation");
    expect(adapted.observations.map((row) => row.sourceRowIndexLexeme)).toEqual(["TEST-POINT-1", "TEST-POINT-2"]);
  });

  it("rejects a duplicate plot pointId after independently confirming only that identity is duplicated", () => {
    const first = plotPoint(1);
    const secondClean = plotPoint(2);
    const second = { ...secondClean, pointId: first.pointId };
    const rows = [first, second];
    expect(rows.map((row) => row.pointId)).toEqual(["TEST-POINT-1", "TEST-POINT-1"]);
    expect((first.adjudication as { acceptedPixels: unknown }).acceptedPixels).not.toEqual(
      (secondClean.adjudication as { acceptedPixels: unknown }).acceptedPixels,
    );

    expect(() => parsers.parsePlotPointRows(plotPointer, plotMetadata, plotArtifact(rows))).toThrow(/duplicates plot point TEST-POINT-1/);
  });

  it("rejects a plot row schema mutation after independently confirming the changed schema", () => {
    const clean = plotPoint(1);
    const mutated = { ...clean, schema: "phase8b-plot-point-v2" };
    expect(mutated.schema).toBe("phase8b-plot-point-v2");
    expect(mutated.schema).not.toBe(clean.schema);

    expect(() => parsers.parsePlotPointRows(plotPointer, plotMetadata, plotArtifact([mutated]))).toThrow(/plot row 1 identity differs/);
  });

  it("rejects a non-object plot uncertainty mutation after independently confirming it", () => {
    const clean = plotPoint(1);
    const mutated = { ...clean, digitizationUncertainty: null };
    expect(clean.digitizationUncertainty).toEqual({ construction: "accepted-pixel-interval" });
    expect(mutated.digitizationUncertainty).toBeNull();

    expect(() => parsers.parsePlotSeries(plotPointer, plotAdapter, plotMetadata, plotArtifact([mutated]))).toThrow(/digitizationUncertainty must be an object/);
  });

  it("rejects a plot interval that excludes its value after independently confirming the bounds", () => {
    const clean = plotPoint(1);
    const cleanX = clean.x as Readonly<Record<string, unknown>>;
    const cleanValue = cleanX.value as number;
    const mutatedX = { ...cleanX, digitizationLower: cleanValue + 0.001 };
    const mutated = { ...clean, x: mutatedX };
    expect(mutatedX.digitizationLower).toBeGreaterThan(cleanValue);

    expect(() => parsers.parsePlotPointRows(plotPointer, plotMetadata, plotArtifact([mutated]))).toThrow(/x interval excludes its value/);
  });
});
