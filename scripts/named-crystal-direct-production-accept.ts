// Bind the exact first direct-production report and its manual three-view review into the tracked
// catalog. This command intentionally refuses any report/contact-sheet byte drift.
//
//   node scripts/named-crystal-direct-production-accept.ts

import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  parseNamedCrystalCatalog,
  renderNamedCrystalCatalogTable,
  summarizeNamedCrystalCatalog,
} from "./named-crystal-catalog.ts";

const REPO = resolve(import.meta.dirname, "..");
const OUT_ROOT = join(REPO, "out", "named-crystal-catalog", "direct-production-v1");
const REPORT_PATH = join(OUT_ROOT, "report.json");
const CONTACT_PATH = join(OUT_ROOT, "contact-sheet.png");
const CATALOG_PATH = join(REPO, "docs", "named-snow-crystal-catalog.json");
const TABLE_PATH = join(REPO, "docs", "named-snow-crystal-catalog.md");
const REVIEW_PATH = join(REPO, "docs", "named-snow-crystal-direct-production-review.json");

const EXPECTED_REPORT = {
  byteLength: 567_085,
  sha256: "ed3153cb3480180555c972ee07c0ec635111deb0773ed9bdcc1726e16dd4ef52",
};
const EXPECTED_CONTACT = {
  byteLength: 8_384_905,
  sha256: "a77d447ecb0ca6b3f4f43de02007d165076f062aa6becbfc4c4ab3677e463346",
};

const FAMILY_RATIONALE: Readonly<Record<string, string>> = {
  "solid-columns": "All three ±5% runs retain one closed, compact hexagonal column without an open axial cavity.",
  "sheaths": "All three ±5% runs retain a long thin hollow wall with an open annular end, distinct from the thicker solid column.",
  "split-plates-and-stars": "All three ±5% runs retain two connected offset plate/star lobes in the face and oblique views.",
  "isolated-bullets": "All three ±5% runs retain one isolated elongated crystal with a visibly tapered bullet end.",
  "scrolls-on-plates": "All three reviewed stop variants retain one raised inward-curled lip attached to the plate.",
  "triangular-forms": "All three reviewed stop variants retain a three-sided external outline rather than returning to a hexagon.",
  "cups": "All three reviewed stop variants retain a short open-ended cup with one closed end.",
  "hollow-plates": "All three reviewed cavity-radius variants retain a centered through-cavity in the plate-like form.",
};

interface ProductWire {
  readonly webByteLength: number;
  readonly webSha256: string;
  readonly stateByteLength: number;
  readonly stateSha256: string;
  readonly frameCount: number;
  readonly bundleFileCount: number;
  readonly bundleBytes: number;
  readonly bundleTreeSha256: string;
}

interface ResultWire {
  readonly jobId: string;
  readonly typeId: string;
  readonly typeName: string;
  readonly slot: "lower" | "baseline" | "upper";
  readonly sourceLane: string;
  readonly sourceJobId: string;
  readonly sourceSpecSha256: string;
  readonly specSha256: string;
  readonly driverName: string;
  readonly driverValue: number;
  readonly reviewViews: readonly string[];
  readonly exitCode: number;
  readonly products: ProductWire;
  readonly failure: string | null;
}

interface ReportWire {
  readonly format: string;
  readonly completed: number;
  readonly failed: number;
  readonly missing: number;
  readonly launch: {
    readonly requestedProcessConcurrency: number;
    readonly actualWorkerCount: number;
  };
  readonly webSummary: {
    readonly minimumBytes: number;
    readonly maximumBytes: number;
    readonly totalBytes: number;
    readonly limitBytes: number;
    readonly allDecoderVerified: boolean;
  };
  readonly scientificSummary: {
    readonly totalBundleBytes: number;
    readonly totalBundleFiles: number;
    readonly minimumFrameCount: number;
    readonly maximumFrameCount: number;
  };
  readonly results: readonly ResultWire[];
}

const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");
const canonicalJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const verifyIdentity = (
  path: string,
  expected: { readonly byteLength: number; readonly sha256: string },
  label: string,
): Uint8Array => {
  const bytes = readFileSync(path);
  if (bytes.byteLength !== expected.byteLength || sha256(bytes) !== expected.sha256) {
    throw new Error(`${label} identity drift`);
  }
  return bytes;
};

const reportBytes = verifyIdentity(REPORT_PATH, EXPECTED_REPORT, "direct-production report");
verifyIdentity(CONTACT_PATH, EXPECTED_CONTACT, "direct-production contact sheet");
const report = JSON.parse(reportBytes.toString()) as ReportWire;
if (
  report.format !== "named-crystal-direct-production-report-v1" ||
  report.completed !== 24 ||
  report.failed !== 0 ||
  report.missing !== 0 ||
  report.results.length !== 24 ||
  report.launch.requestedProcessConcurrency !== 24 ||
  report.launch.actualWorkerCount !== 24 ||
  report.webSummary.limitBytes !== 20_000_000 ||
  report.webSummary.allDecoderVerified !== true
) {
  throw new Error("direct-production report does not satisfy the registered tranche contract");
}
if (new Set(report.results.map(({ jobId }) => jobId)).size !== 24) {
  throw new Error("direct-production report duplicates a job identity");
}
for (const result of report.results) {
  if (
    result.exitCode !== 0 ||
    result.failure !== null ||
    result.products.webByteLength >= 20_000_000 ||
    result.products.frameCount < 100 ||
    result.products.frameCount > 122 ||
    FAMILY_RATIONALE[result.typeId] === undefined
  ) {
    throw new Error(`${result.jobId}: result is not eligible for acceptance`);
  }
}

const byType = new Map<string, ResultWire[]>();
for (const result of report.results) {
  const family = byType.get(result.typeId) ?? [];
  family.push(result);
  byType.set(result.typeId, family);
}
if (byType.size !== 8) throw new Error("direct-production review must contain eight families");
for (const [typeId, family] of byType) {
  if (
    family.length !== 3 ||
    family.map(({ slot }) => slot).sort().join(",") !== "baseline,lower,upper"
  ) {
    throw new Error(`${typeId}: review must contain lower/baseline/upper exactly once`);
  }
}

const review = {
  format: "named-crystal-direct-production-review-v1",
  reviewedAt: "2026-08-30",
  sourceManifest: "docs/named-snow-crystal-direct-production.json",
  sourceReport: {
    path: "out/named-crystal-catalog/direct-production-v1/report.json",
    ...EXPECTED_REPORT,
  },
  contactSheet: {
    path: "out/named-crystal-catalog/direct-production-v1/contact-sheet.png",
    ...EXPECTED_CONTACT,
    views: ["face-0-degrees", "oblique-55-degrees", "axial-85-degrees"],
  },
  executionSummary: {
    requestedProcessConcurrency: report.launch.requestedProcessConcurrency,
    actualWorkerCount: report.launch.actualWorkerCount,
    completed: report.completed,
    failed: report.failed,
    minimumWebBytes: report.webSummary.minimumBytes,
    maximumWebBytes: report.webSummary.maximumBytes,
    totalWebBytes: report.webSummary.totalBytes,
    webPayloadLimitBytes: report.webSummary.limitBytes,
    allWebAssetsDecoderVerified: report.webSummary.allDecoderVerified,
    totalScientificBundleBytes: report.scientificSummary.totalBundleBytes,
    totalScientificBundleFiles: report.scientificSummary.totalBundleFiles,
    minimumFrameCount: report.scientificSummary.minimumFrameCount,
    maximumFrameCount: report.scientificSummary.maximumFrameCount,
  },
  counts: {
    acceptedFamilies: 8,
    acceptedVariants: 24,
    catalogSlotsFilledAfterReview: 24,
  },
  families: [...byType.entries()].sort(([left], [right]) => left.localeCompare(right)).map(
    ([typeId, family]) => ({
      typeId,
      status: "accepted",
      rationale: FAMILY_RATIONALE[typeId],
      variants: [...family].sort((left, right) => left.slot.localeCompare(right.slot)).map((result) => ({
        jobId: result.jobId,
        slot: result.slot,
        sourceLane: result.sourceLane,
        sourceJobId: result.sourceJobId,
        sourceSpecSha256: result.sourceSpecSha256,
        specSha256: result.specSha256,
        driverName: result.driverName,
        driverValue: result.driverValue,
        webByteLength: result.products.webByteLength,
        webSha256: result.products.webSha256,
        stateByteLength: result.products.stateByteLength,
        stateSha256: result.products.stateSha256,
        frameCount: result.products.frameCount,
        bundleFileCount: result.products.bundleFileCount,
        bundleBytes: result.products.bundleBytes,
        bundleTreeSha256: result.products.bundleTreeSha256,
      })),
    }),
  ),
};
writeFileSync(REVIEW_PATH, canonicalJson(review));

const rawCatalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as {
  entries: Array<Record<string, unknown>>;
};
for (const [typeId, family] of byType) {
  const entry = rawCatalog.entries.find((candidate) => candidate.id === typeId);
  if (entry === undefined) throw new Error(`${typeId}: catalog row is missing`);
  const variants = entry.variants as Record<string, unknown>;
  for (const result of family) {
    const existing = variants[result.slot] as { readonly entryId?: unknown } | null;
    if (existing !== null && existing.entryId !== result.jobId) {
      throw new Error(`${result.jobId}: catalog slot is occupied by another entry`);
    }
    const unit = result.driverName === "rho-scale"
      ? "multiplier"
      : result.driverName === "stop-tick" ? "ticks" : "lattice sites";
    const root = `out/named-crystal-catalog/direct-production-v1/${result.jobId}`;
    variants[result.slot] = {
      entryId: result.jobId,
      variation: { driver: result.driverName, value: result.driverValue, unit },
      links: {
        preview: `out/named-crystal-catalog/direct-production-v1/review-renders/${result.jobId}-tilt55.png`,
        webAsset: `${root}/growth-v1.bin`,
        recipeOrScene: `${root}/spec.json`,
        scientificBundle: `${root}/`,
      },
      webPayloadBytes: result.products.webByteLength,
    };
  }
  entry.note = `Accepted direct-production trio; exact output identities and three-view rationale are in docs/named-snow-crystal-direct-production-review.json.`;
}
writeFileSync(CATALOG_PATH, canonicalJson(rawCatalog));
const catalog = parseNamedCrystalCatalog(rawCatalog);
const summary = summarizeNamedCrystalCatalog(catalog);
if (summary.acceptedSlots !== 24 || summary.remainingSlots !== 75) {
  throw new Error("catalog did not reach the expected 24 accepted / 75 remaining state");
}
writeFileSync(TABLE_PATH, renderNamedCrystalCatalogTable(catalog, TABLE_PATH));
console.log(JSON.stringify({
  review: REVIEW_PATH,
  catalog: CATALOG_PATH,
  table: TABLE_PATH,
  acceptedSlots: summary.acceptedSlots,
  remainingSlots: summary.remainingSlots,
  reportBytes: statSync(REPORT_PATH).size,
}));
