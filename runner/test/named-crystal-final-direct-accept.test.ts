import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { parseNamedCrystalCatalog, summarizeNamedCrystalCatalog } from "../../scripts/named-crystal-catalog.ts";
import { acceptFinalDirectCatalog } from "../../scripts/named-crystal-final-direct-accept.ts";

const REPO = resolve(import.meta.dirname, "../..");
const SOURCE_CATALOG = join(REPO, "docs", "named-snow-crystal-catalog.json");
const roots: string[] = [];
const SLOTS = ["lower", "baseline", "upper"] as const;
const TYPES = {
  a: [
    "simple-prisms", "hexagonal-plates", "hollow-columns", "stellar-plates",
    "capped-columns", "sectored-plates", "simple-needles", "fernlike-stellar-dendrites",
  ],
  b: [
    "solid-columns", "sheaths", "split-plates-and-stars", "isolated-bullets",
    "scrolls-on-plates", "triangular-forms", "cups", "hollow-plates",
  ],
  c: [
    "columns-on-plates", "skeletal-forms", "simple-stars", "stellar-dendrites",
    "double-plates", "capped-bullets",
  ],
} as const;
const CAPPED_STOPS = [2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500] as const;

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

const sha256 = (bytes: Uint8Array | string): string => createHash("sha256").update(bytes).digest("hex");
const writeJson = (path: string, value: unknown): void => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const identity = (repo: string, path: string) => {
  const bytes = readFileSync(path);
  return { path: relative(repo, path), byteLength: bytes.byteLength, sha256: sha256(bytes) };
};

const encodeGrowth = (): Uint8Array => {
  const events = [[1, 0], [2, 0], [3, 5], [7, 20]] as const;
  const header = new TextEncoder().encode(JSON.stringify({
    format: "gutcheck-growth-v1",
    eventCount: events.length,
    attachedCount: events.length,
    seedCount: 2,
    finalTick: 20,
    config: { dims: { nx: 4, ny: 4, nz: 2 }, center: [2, 2, 1] },
  }));
  const bytes = new Uint8Array(4 + header.length + events.length * 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, header.length, true);
  bytes.set(header, 4);
  for (const [index, [flat, tick]] of events.entries()) {
    view.setUint32(4 + header.length + index * 8, flat, true);
    view.setUint32(4 + header.length + index * 8 + 4, tick, true);
  }
  return bytes;
};

interface FixtureOptions {
  readonly cappedStops?: readonly number[];
  readonly omitClearanceJobId?: string;
}

interface Fixture {
  readonly root: string;
  readonly decisions: string;
  readonly catalog: string;
  readonly table: string;
  readonly review: string;
  readonly reports: Readonly<Record<"a" | "b" | "c", string>>;
  readonly firstWebAsset: string;
}

const fixture = (options: FixtureOptions = {}): Fixture => {
  const root = mkdtempSync(join(tmpdir(), "named-final-direct-"));
  roots.push(root);
  const catalog = join(root, "catalog.json");
  const table = join(root, "catalog.md");
  const review = join(root, "direct-review.json");
  writeFileSync(catalog, readFileSync(SOURCE_CATALOG));
  const growth = encodeGrowth();
  const growthSha = sha256(growth);
  const fleets = [];
  const reports = {} as Record<"a" | "b" | "c", string>;
  let firstWebAsset = "";

  for (const fleet of ["a", "b", "c"] as const) {
    const fleetRoot = join(root, "out", fleet);
    mkdirSync(fleetRoot, { recursive: true });
    const results: Array<Record<string, unknown>> = [];
    const families: Array<Record<string, unknown>> = [];
    for (const typeId of TYPES[fleet]) {
      const familyResults = typeId === "capped-bullets"
        ? CAPPED_STOPS.map((stopTick) => ({
            jobId: `capped-bullets-stop-${stopTick}`,
            slot: "baseline" as const,
            driverName: "stop-tick",
            driverValue: stopTick,
          }))
        : SLOTS.map((slot, index) => ({
            jobId: `${typeId}-${slot}`,
            slot,
            driverName: "rho-scale",
            driverValue: [0.95, 1, 1.05][index]!,
          }));
      for (const job of familyResults) {
        const jobRoot = join(fleetRoot, job.jobId);
        mkdirSync(jobRoot, { recursive: true });
        const webAsset = join(jobRoot, "growth-v1.bin");
        writeFileSync(webAsset, growth);
        if (firstWebAsset === "") firstWebAsset = webAsset;
        writeFileSync(join(jobRoot, "spec.json"), "{}\n");
        results.push({
          jobId: job.jobId,
          typeId,
          typeName: typeId,
          slot: job.slot,
          sourceLane: `fixture-${fleet}`,
          sourceJobId: `source-${typeId}`,
          sourceSpecSha256: "c".repeat(64),
          specSha256: "d".repeat(64),
          driverName: job.driverName,
          driverValue: job.driverValue,
          dims: [4, 4, 2],
          reviewViews: ["face", "oblique", "axial"],
          exitCode: 0,
          products: {
            webDecoder: "decodeGrowthAssetV1",
            webByteLength: growth.byteLength,
            webSha256: growthSha,
            stateByteLength: 8,
            stateSha256: "e".repeat(64),
            frameCount: 121,
            bundleFileCount: 126,
            bundleBytes: 1234,
            bundleTreeSha256: sha256(`tree:${fleet}:${job.jobId}`),
          },
          failure: null,
        });
      }
      const selectedJobIds = typeId === "capped-bullets"
        ? (options.cappedStops ?? CAPPED_STOPS.slice(0, 3)).map((tick) => `capped-bullets-stop-${tick}`)
        : familyResults.map(({ jobId }) => jobId);
      families.push({
        typeId,
        rationale: `${typeId} retains its named external form in all registered review views.`,
        selectedJobIds,
      });
    }
    expect(results).toHaveLength(24);
    const reportPath = join(fleetRoot, "report.json");
    writeJson(reportPath, {
      format: "named-crystal-direct-production-report-v1",
      launch: { requestedProcessConcurrency: 24, actualWorkerCount: 24 },
      completed: 24,
      failed: 0,
      missing: 0,
      webSummary: {
        minimumBytes: growth.byteLength,
        maximumBytes: growth.byteLength,
        totalBytes: growth.byteLength * 24,
        limitBytes: 20_000_000,
        allDecoderVerified: true,
      },
      scientificSummary: {
        totalBundleBytes: 1234 * 24,
        totalBundleFiles: 126 * 24,
        minimumFrameCount: 121,
        maximumFrameCount: 121,
      },
      results,
    });
    reports[fleet] = reportPath;
    const contactPath = join(fleetRoot, "contact-sheet.png");
    writeFileSync(contactPath, `fixture contact ${fleet}`);
    const clearanceResults = results
      .filter(({ jobId }) => jobId !== options.omitClearanceJobId)
      .map(({ jobId, typeId }) => ({ jobId, typeId, passed: true }));
    const clearancePath = join(fleetRoot, "vertical-clearance.json");
    writeJson(clearancePath, {
      format: fleet === "c"
        ? "named-crystal-final-resolution-vertical-clearance-c-v1"
        : "named-crystal-final-resolution-vertical-clearance-v1",
      fleet,
      gate: { minimumLayers: 16, minimumFractionOfNz: 0.05, typeIds: TYPES[fleet] },
      requiredResults: clearanceResults.length,
      results: clearanceResults,
    });
    fleets.push({
      fleet,
      report: identity(root, reportPath),
      contactSheet: identity(root, contactPath),
      verticalClearance: identity(root, clearancePath),
      families,
    });
  }
  const decisions = join(root, "decisions.json");
  writeJson(decisions, {
    format: "named-crystal-final-direct-decisions-v1",
    reviewedAt: "2026-08-30",
    fleets,
  });
  return { root, decisions, catalog, table, review, reports, firstWebAsset };
};

const accept = (value: Fixture) => acceptFinalDirectCatalog(
  value.decisions,
  value.catalog,
  value.table,
  value.review,
  value.root,
);

describe("named crystal final direct acceptance", () => {
  it("verifies three fleets and fills exactly 66 direct catalog slots", () => {
    const value = fixture();
    const result = accept(value);
    expect(result).toMatchObject({ acceptedFamilies: 22, acceptedVariants: 66, remainingVariants: 33 });
    const catalog = parseNamedCrystalCatalog(JSON.parse(readFileSync(value.catalog, "utf8")) as unknown);
    expect(summarizeNamedCrystalCatalog(catalog)).toMatchObject({ acceptedSlots: 66, remainingSlots: 33 });
    expect(catalog.entries.find(({ id }) => id === "multiply-capped-columns")?.route).toBe("gg-plus");
    expect(catalog.entries.find(({ id }) => id === "needle-clusters")?.route).toBe("gg-plus");
    const review = JSON.parse(readFileSync(value.review, "utf8")) as {
      readonly format: string;
      readonly families: readonly { readonly typeId: string; readonly variants: readonly unknown[] }[];
    };
    expect(review.format).toBe("named-crystal-final-direct-review-v1");
    expect(review.families).toHaveLength(22);
    expect(review.families.flatMap(({ variants }) => variants)).toHaveLength(66);
    const capped = review.families.find(({ typeId }) => typeId === "capped-bullets")!;
    expect(capped.variants).toHaveLength(3);
  });

  it("refuses exact report identity drift", () => {
    const value = fixture();
    writeFileSync(value.reports.a, "drift", { flag: "a" });
    expect(() => accept(value)).toThrow(/report identity drift/);
  });

  it("refuses non-adjacent capped-bullet selections", () => {
    const value = fixture({ cappedStops: [2750, 3250, 3500] });
    expect(() => accept(value)).toThrow(/three adjacent registered candidates/);
  });

  it("refuses selected web asset identity drift", () => {
    const value = fixture();
    writeFileSync(value.firstWebAsset, "drift", { flag: "a" });
    expect(() => accept(value)).toThrow(/selected web asset identity drift/);
  });

  it("refuses incomplete registered vertical-clearance coverage", () => {
    const value = fixture({ omitClearanceJobId: "simple-prisms-lower" });
    expect(() => accept(value)).toThrow(/clearance rows do not cover every registered vertical job/);
  });
});
